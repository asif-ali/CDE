// =====================================================================
//  submit-enquiry — the only door into the enquiries table
//
//  The contact form on index.html. Added 2026-10-06; before it, the form
//  built a `mailto:` and hoped. On a phone without a configured mail client
//  that does nothing visible, so enquiries were being lost in silence.
//
//  Deliberately simpler than submit-application: one request, no files, no
//  storage, no multi-step token. Everything else is the same by design — the
//  browser holds no key, authorisation is RLS in Postgres, and this function
//  is the only thing with a service role key.
//
//  Deploy exactly like the other one:
//    supabase functions deploy submit-enquiry --no-verify-jwt
//
//  --no-verify-jwt is what lets index.html post here with no API key at all.
//  The function is still not open season: origin is checked, the payload is
//  validated and truncated, Turnstile is verified when configured, and one
//  connection gets a handful of enquiries an hour.
// =====================================================================

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const TURNSTILE    = Deno.env.get("TURNSTILE_SECRET") ?? "";
const IP_SALT      = Deno.env.get("IP_SALT") ?? "";
const ORIGINS      = (Deno.env.get("ALLOWED_ORIGINS") ?? "")
  .split(",").map((s: string) => s.trim()).filter(Boolean);

// Lower than the applications limit of 5. Nobody has five *different* things
// to ask in an hour, and this form costs a visitor nothing to resubmit.
const MAX_PER_IP_PER_HOUR = 4;

// Field -> maximum stored length. Anything longer is truncated rather than
// rejected: a visitor who pastes an essay should not lose it to a 400.
const TEXT_FIELDS: Record<string, number> = {
  name: 120, company: 160, email: 160, phone: 40, division: 80, message: 5000,
};
const REQUIRED = ["name", "email", "message"];

// ---------------------------------------------------------------- helpers

function cors(origin: string | null) {
  // Same rule as submit-application: with no allowlist we fall back to '*',
  // and otherwise we return a configured origin rather than echoing back
  // whatever the caller claimed.
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

const clean = (v: unknown, max: number) =>
  typeof v === "string" ? v.trim().slice(0, max) || null : null;

const isEmail = (s: string) => /^[^@\s]+@[^@\s.]+\.[^@\s]{2,}$/.test(s);

async function verifyTurnstile(token: string, ip: string) {
  // Unset secret = no bot protection. Allowed so the form works before
  // Cloudflare is configured, but it is logged loudly and must not ship
  // that way on a public page.
  if (!TURNSTILE) {
    console.warn("TURNSTILE_SECRET is not set — enquiries are unprotected");
    return true;
  }
  if (!token) return false;
  const body = new FormData();
  body.append("secret", TURNSTILE);
  body.append("response", token);
  if (ip) body.append("remoteip", ip);
  try {
    const r = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify",
                          { method: "POST", body });
    return (await r.json())?.success === true;
  } catch {
    // Cloudflare being unreachable must not take the contact form down with
    // it. An enquiry is worth more than the bot it might let through.
    console.error("Turnstile verification failed to complete — allowing");
    return true;
  }
}

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

  if (!(await verifyTurnstile(String(body.turnstile ?? ""), ip))) {
    return json({ error: "That did not look like a human. Please try again." }, 400, origin);
  }

  // Flood control.
  if (ipHash) {
    const since = new Date(Date.now() - 3600_000).toISOString();
    const r = await db(
      `enquiries?select=id&submitted_ip_hash=eq.${ipHash}&created_at=gte.${since}`,
      { headers: { Prefer: "count=exact", Range: "0-0" } },
    );
    const total = Number((r.headers.get("content-range") ?? "/0").split("/")[1] ?? 0);
    if (total >= MAX_PER_IP_PER_HOUR) {
      return json({ error: "Too many enquiries from this connection. Please try again later, or email us directly." }, 429, origin);
    }
  }

  // ---- field validation
  const row: Record<string, unknown> = { submitted_ip_hash: ipHash };
  for (const [f, max] of Object.entries(TEXT_FIELDS)) row[f] = clean(body[f], max);

  for (const f of REQUIRED) {
    if (!row[f]) return json({ error: `Please fill in your ${f}.` }, 400, origin);
  }
  if (!isEmail(String(row.email))) {
    return json({ error: "That email address does not look right." }, 400, origin);
  }

  try {
    const r = await db("enquiries", { method: "POST", body: JSON.stringify(row) });
    if (!r.ok) {
      // Never let a Postgres error reach the visitor: its text can describe
      // the schema. Logged in full here, generic there.
      console.error("enquiry insert failed", r.status, await r.text());
      return json({ error: "Something went wrong at our end. Please email info@chemicaldynamicsqatar.com." }, 500, origin);
    }
  } catch (err) {
    console.error("enquiry insert threw", err);
    return json({ error: "Something went wrong at our end. Please email info@chemicaldynamicsqatar.com." }, 500, origin);
  }

  return json({ ok: true }, 200, origin);
});
