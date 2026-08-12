// =====================================================================
//  submit-application — the only door into the applications table
//
//  Deployed with --no-verify-jwt, so careers.html needs no API key of any
//  kind. That is the point: there is nothing in the public page to steal.
//  Everything that matters — the service role key, the Turnstile secret, the
//  IP salt — lives in Supabase's secret store and never leaves this process.
//
//  Three steps, because the browser must upload files directly to storage
//  (routing 25MB of documents through a function would be slower and would
//  hit its body limit):
//
//    start   validate everything → insert a 'pending_upload' row → hand back
//            four one-time signed upload URLs, each locked to one exact path
//    upload  browser PUTs straight to storage using those URLs
//    finish  confirm the files really landed → flip the row to 'new'
//
//  A visitor therefore cannot: upload to a path of their choosing, attach a
//  file to somebody else's application, mark an arbitrary row as submitted,
//  or read back anything at all.
//
//  Deploy:  supabase functions deploy submit-application --no-verify-jwt
// =====================================================================

// Deno globals for editors and `deno check`. Supabase supplies the runtime.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const TURNSTILE    = Deno.env.get("TURNSTILE_SECRET") ?? "";
const IP_SALT      = Deno.env.get("IP_SALT") ?? "";
const ORIGINS      = (Deno.env.get("ALLOWED_ORIGINS") ?? "")
  .split(",").map((s: string) => s.trim()).filter(Boolean);

const BUCKET = "applicant-docs";

// Per-document rules. Enforced here as well as in the browser and on the
// bucket itself — the browser copy is a courtesy, this one is the rule.
const DOCS: Record<string, { mimes: string[]; max: number; label: string }> = {
  doc_qid: {
    label: "QID photo",
    mimes: ["image/jpeg", "image/png", "image/webp"],
    max: 5 * 1024 * 1024,
  },
  doc_photo: {
    label: "Passport-size photograph",
    mimes: ["image/jpeg", "image/png", "image/webp"],
    max: 5 * 1024 * 1024,
  },
  doc_cv: {
    label: "CV / Résumé",
    mimes: [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ],
    max: 10 * 1024 * 1024,
  },
  doc_residence: {
    label: "Proof of residence",
    mimes: ["application/pdf", "image/jpeg", "image/png", "image/webp"],
    max: 10 * 1024 * 1024,
  },
};

const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "application/pdf": "pdf",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
};

// Text fields we accept, with a length ceiling each. An allowlist rather than
// "copy the body into the insert" — otherwise a crafted payload could set
// status, reviewed_by or upload_token on the way in.
const TEXT_FIELDS: Record<string, number> = {
  position_applied: 120,
  full_name: 120,
  fathers_name: 120,
  email: 160,
  mobile: 32,
  nationality: 60,
  qid_number: 32,
  passport_number: 32,
  occupation_on_qid: 120,
  visa_status: 60,
  address: 400,
  city: 80,
  expected_salary: 60,
  current_employer: 120,
  previous_employers: 400,
  driving_license: 80,
  highest_qualification: 120,
  notes: 2000,
};
const DATE_FIELDS = ["date_of_birth", "qid_expiry", "passport_expiry", "available_from"];
const REQUIRED = ["position_applied", "full_name", "email", "mobile"];

const MAX_PER_IP_PER_HOUR = 5;

// ---------------------------------------------------------------- helpers

function cors(origin: string | null) {
  // With no allowlist configured we fall back to '*'. That is safe here —
  // the endpoint holds no cookies and no session, so there is no cross-origin
  // privilege to borrow — but setting ALLOWED_ORIGINS stops other sites
  // pointing their own forms at CDE's inbox.
  const allow = ORIGINS.length === 0
    ? "*"
    : (origin && ORIGINS.includes(origin) ? origin : ORIGINS[0]);
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Headers": "content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}

function json(body: unknown, status: number, origin: string | null) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", ...cors(origin) },
  });
}

async function sha256(s: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function db(path: string, init: RequestInit = {}) {
  return fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      "content-type": "application/json",
      ...(init.headers ?? {}),
    },
  });
}

function storage(path: string, init: RequestInit = {}) {
  return fetch(`${SUPABASE_URL}/storage/v1/${path}`, {
    ...init,
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      // Only when there is actually a body. Storage runs Fastify, which rejects
      // a JSON content-type on an empty body with "Body cannot be empty" — and
      // the signed-upload-URL call is a POST with no body. Setting this header
      // unconditionally made every submission fail at the upload step.
      ...(init.body ? { "content-type": "application/json" } : {}),
      ...(init.headers ?? {}),
    },
  });
}

async function verifyTurnstile(token: string, ip: string) {
  // Unset secret = no bot protection. Allowed so the form can be demoed before
  // Cloudflare is set up, but it is logged loudly and must not ship that way.
  if (!TURNSTILE) {
    console.warn("TURNSTILE_SECRET is not set — submissions are unprotected");
    return true;
  }
  if (!token) return false;
  const body = new FormData();
  body.append("secret", TURNSTILE);
  body.append("response", token);
  if (ip) body.append("remoteip", ip);
  const r = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body,
  });
  const out = await r.json().catch(() => ({ success: false }));
  return out.success === true;
}

const clean = (v: unknown, max: number) =>
  typeof v === "string" ? v.trim().slice(0, max) || null : null;

const isEmail = (s: string) => /^[^@\s]+@[^@\s.]+\.[^@\s]{2,}$/.test(s);
const isDate  = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(Date.parse(s));
const isUuid  = (s: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);

// ---------------------------------------------------------------- handler

Deno.serve(async (req) => {
  const origin = req.headers.get("origin");
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors(origin) });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405, origin);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Malformed request." }, 400, origin);
  }

  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim();
  const ipHash = ip ? (await sha256(IP_SALT + ip)).slice(0, 32) : null;

  try {
    if (body.action === "finish") return await finish(body, origin);
    return await start(body, ipHash, ip, origin);
  } catch (err) {
    // Never let a database or storage error reach the applicant — the text of
    // a Postgres error describes the schema.
    console.error("submit-application failed:", err);
    return json({ error: "Something went wrong. Please try again." }, 500, origin);
  }
});

// ------------------------------------------------------------------ start

async function start(
  body: Record<string, unknown>,
  ipHash: string | null,
  ip: string,
  origin: string | null,
) {
  if (!await verifyTurnstile(String(body.turnstile_token ?? ""), ip)) {
    return json({ error: "Verification failed. Please tick the checkbox and try again." }, 403, origin);
  }

  if (body.consent !== true) {
    return json({ error: "We cannot accept an application without your consent." }, 400, origin);
  }

  // Flood control. Five genuine applications an hour from one connection is
  // already generous; a household or an office share an address, so this is
  // set to inconvenience a script, not to turn anyone away.
  if (ipHash) {
    const since = new Date(Date.now() - 3600_000).toISOString();
    const r = await db(
      `applications?select=id&submitted_ip_hash=eq.${ipHash}&created_at=gte.${since}`,
      { headers: { Prefer: "count=exact", Range: "0-0" } },
    );
    const total = Number((r.headers.get("content-range") ?? "/0").split("/")[1] ?? 0);
    if (total >= MAX_PER_IP_PER_HOUR) {
      return json({ error: "Too many applications from this connection. Please try again later." }, 429, origin);
    }
  }

  // ---- field validation
  const row: Record<string, unknown> = { consent_given: true, submitted_ip_hash: ipHash };

  for (const [f, max] of Object.entries(TEXT_FIELDS)) row[f] = clean(body[f], max);
  for (const f of REQUIRED) {
    if (!row[f]) return json({ error: `${f.replace(/_/g, " ")} is required.` }, 400, origin);
  }
  if (!isEmail(String(row.email))) {
    return json({ error: "That email address does not look right." }, 400, origin);
  }
  if (!/^[\d+\s()-]{7,}$/.test(String(row.mobile))) {
    return json({ error: "That mobile number does not look right." }, 400, origin);
  }

  for (const f of DATE_FIELDS) {
    const v = body[f];
    if (typeof v === "string" && v.trim()) {
      if (!isDate(v.trim())) return json({ error: `${f.replace(/_/g, " ")} is not a valid date.` }, 400, origin);
      row[f] = v.trim();
    } else row[f] = null;
  }

  const yrs = Number(body.years_experience);
  row.years_experience = Number.isFinite(yrs) && yrs >= 0 && yrs <= 70 ? yrs : null;

  // ---- document manifest
  const files = (body.files ?? {}) as Record<string, { type?: string; size?: number }>;
  for (const kind of Object.keys(DOCS)) {
    const spec = DOCS[kind];
    const f = files[kind];
    if (!f) return json({ error: `${spec.label} is required.` }, 400, origin);
    if (!spec.mimes.includes(String(f.type))) {
      return json({ error: `${spec.label}: that file type is not accepted.` }, 400, origin);
    }
    if (!Number.isFinite(f.size) || f.size! <= 0 || f.size! > spec.max) {
      return json({
        error: `${spec.label} must be under ${Math.round(spec.max / 1048576)}MB.`,
      }, 400, origin);
    }
  }

  // ---- insert
  const ins = await db("applications?select=id,upload_token", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify(row),
  });
  if (!ins.ok) throw new Error(`insert failed: ${ins.status} ${await ins.text()}`);
  const [created] = await ins.json();

  // ---- one signed upload URL per document, each bound to one exact path
  const uploads: Record<string, { path: string; url: string }> = {};
  for (const kind of Object.keys(DOCS)) {
    const ext  = EXT[String(files[kind].type)] ?? "bin";
    const path = `${created.id}/${kind}.${ext}`;
    const r = await storage(`object/upload/sign/${BUCKET}/${path}`, { method: "POST" });
    if (!r.ok) throw new Error(`sign failed for ${kind}: ${r.status} ${await r.text()}`);
    const signed = await r.json();   // { url: "/object/upload/sign/<bucket>/<path>?token=…" }

    // Hand back the whole signed URL, token and all. Storage requires the token
    // as a query parameter — an Authorization header is rejected with
    // "querystring must have required property 'token'" — so returning the
    // pieces separately just invites the caller to reassemble them wrongly.
    uploads[kind] = { path, url: `${SUPABASE_URL}/storage/v1${signed.url}` };
  }

  return json({ id: created.id, upload_token: created.upload_token, uploads }, 200, origin);
}

// ----------------------------------------------------------------- finish

async function finish(body: Record<string, unknown>, origin: string | null) {
  const id    = String(body.id ?? "");
  const token = String(body.upload_token ?? "");
  if (!isUuid(id) || !isUuid(token)) return json({ error: "Invalid request." }, 400, origin);

  const sel = await db(
    `applications?select=id,status,upload_token&id=eq.${id}&status=eq.pending_upload`,
  );
  const rows = await sel.json();
  const app = rows[0];

  // Constant-time-ish comparison is overkill for a 122-bit random UUID that
  // gets one attempt, but the token must match and it must not have been used.
  if (!app || app.upload_token !== token) {
    return json({ error: "Invalid request." }, 403, origin);
  }

  // Confirm the files actually arrived. Without this, a client could skip the
  // uploads entirely and file an application with four empty document slots.
  const list = await storage(`object/list/${BUCKET}`, {
    method: "POST",
    body: JSON.stringify({ prefix: `${id}/`, limit: 20 }),
  });
  const objects: Array<{ name: string; metadata?: { size?: number } }> = await list.json();

  const paths: Record<string, string> = {};
  for (const kind of Object.keys(DOCS)) {
    const hit = objects.find((o) => o.name.startsWith(`${kind}.`) && (o.metadata?.size ?? 0) > 0);
    if (!hit) return json({ error: `${DOCS[kind].label} did not finish uploading.` }, 400, origin);
    paths[kind] = `${id}/${hit.name}`;
  }

  // upload_token is nulled in the same statement that flips the status, so the
  // finish step cannot be replayed.
  const upd = await db(`applications?id=eq.${id}&status=eq.pending_upload`, {
    method: "PATCH",
    body: JSON.stringify({ status: "new", upload_token: null, ...paths }),
  });
  if (!upd.ok) throw new Error(`finalise failed: ${upd.status} ${await upd.text()}`);

  return json({ ok: true, reference: id.slice(0, 8).toUpperCase() }, 200, origin);
}
