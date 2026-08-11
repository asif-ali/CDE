# Careers form & HR dashboard — setup

Two new pages, backed by one Supabase project:

| File | What it is | Who sees it |
|---|---|---|
| `careers.html` | Public job application form, four document uploads | Anyone |
| `admin.html` | Applicant list, detail view, document viewer, status workflow | Signed-in HR staff |
| `supabase/schema.sql` | Tables, row-level security, private storage bucket | run once |
| `supabase/functions/submit-application/` | The only thing that can write an application | deployed |

Both HTML pages keep the repo's rules: no build step, no dependencies, CSS and JS
inline, opens from disk. They are static files — host them exactly like `index.html`.

---

## Why not Google Drive

It was the first idea and it is the wrong one for these documents.

An Apps Script web app that writes into Drive has to be published "anyone, even
anonymous" for a public form to reach it, which is a permanently open endpoint
writing into somebody's personal Drive. The files inherit Drive's sharing model,
where one careless "anyone with the link" turns a folder of QID scans into
public URLs. There is no admin login you control, no per-record access rules, no
audit of who opened what, and the "dashboard" is a spreadsheet that every viewer
can see in full.

For a contact form that is fine. For passport and QID images it is not.

If CDE still wants the files visible in Drive, the safe shape is Supabase as the
system of record with a scheduled export into a **Shared Drive** (owned by the
company, not a person) — not a public form writing directly into Drive.

---

## The security model, in full

You asked whether a static site can be hijacked from the front end. Here is
precisely what protects what.

**There is no secret in `careers.html`.** No API key, no database URL, no
credential. It posts to an Edge Function deployed with `--no-verify-jwt`. Read
the source, and you learn the endpoint exists — which you would also learn by
pressing Submit.

**The `applications` table has RLS enabled and no policy for the `anon` role.**
This is the important one. Anonymous reads do not "fail" — they return zero rows,
because no policy grants them any. Even holding the publishable key from
`admin.html`, `GET /rest/v1/applications` returns `[]`. Nothing in the browser
can widen that; policies are evaluated by Postgres.

**Applications are written only by the Edge Function**, which runs on Supabase's
servers under the service role. That key never leaves the server. The function
re-validates every field the browser validated, ignores any field not on its
allowlist (so a crafted payload cannot set `status` or `reviewed_by`), verifies
the Turnstile token, and rate-limits by hashed IP.

**Uploads use one-time signed URLs**, minted server-side after validation and
locked to one exact path (`<application-id>/doc_cv.pdf`). An applicant cannot
choose where a file lands, cannot overwrite anyone else's documents, and cannot
upload a fifth file.

**The bucket is private.** File size and MIME type are constrained on the bucket
itself, so the last line of defence is not one anybody can edit out. Admins read
documents through URLs signed for 60 seconds, generated per click.

**`admin.html` is a public file and that is fine.** It contains the publishable
anon key, which is public by design — it names the anonymous role, it is not a
credential. There is no `if (isLoggedIn)` to delete, because the page has no
authority of its own: every query carries the signed-in user's token and
Postgres checks it against the `admins` table. Strip out all the JavaScript that
hides the UI and you get an empty table and a wall of 401s.

**Admin `UPDATE` is narrowed by column grant** to `status`, `admin_notes`,
`reviewed_by`, `reviewed_at`. An admin cannot rewrite an applicant's QID even
through the raw API. Nobody holds `DELETE`.

### What this does *not* protect against

Stated plainly, because a list of defences with no residual risk is a sales
pitch, not a threat model.

1. **A compromised admin account is game over.** Enable MFA (step 6). The
   dashboard already implements the TOTP step.
2. **Anyone can submit junk applications.** Turnstile plus five-per-hour-per-IP
   raises the cost; it does not make it zero. Real spam gets handled in triage.
3. **The CSV export is plaintext personal data** on whatever laptop downloaded
   it. The dashboard warns on every export. That warning is the only control.
4. **Supabase project access is a second front door.** Whoever can log into the
   Supabase dashboard can read everything, service role key included. Enable 2FA
   on those accounts and keep the member list short.
5. **Retention is unimplemented on purpose.** See step 8.

---

## Setup

### 1. Create the project

[supabase.com](https://supabase.com) → new project. Pick the region closest to
Qatar — **Frankfurt (eu-central-1)** is the usual choice; there is no Gulf
region. Save the database password somewhere real.

From **Project Settings → API**, note the **Project URL** and the
**publishable / anon key**. Never copy the **service_role** key into any file in
this repo.

### 2. Run the schema

**SQL Editor → New query** → paste all of `supabase/schema.sql` → Run. It is
idempotent; re-running it is safe.

### 3. Deploy the Edge Function

```bash
npm i -g supabase          # or: brew install supabase/tap/supabase
supabase login
supabase link --project-ref YOUR-PROJECT-REF
supabase functions deploy submit-application --no-verify-jwt
```

`--no-verify-jwt` is required and is what keeps the API key out of the public
page. The function does its own verification.

### 4. Set the function's secrets

```bash
supabase secrets set \
  TURNSTILE_SECRET="0x4AAA…"                              \
  IP_SALT="$(openssl rand -hex 32)"                        \
  ALLOWED_ORIGINS="https://chemicaldynamicsqatar.com"
```

- `TURNSTILE_SECRET` — from step 5. Leave unset only while testing; the function
  logs a warning on every submission when it is missing.
- `IP_SALT` — any long random string, set once. It is what makes the stored IP
  hashes non-reversible. **Changing it later breaks rate limiting** (old hashes
  stop matching), so generate it once and leave it.
- `ALLOWED_ORIGINS` — comma-separated. Stops another site pointing its own form
  at CDE's applicant table.

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are injected automatically. Do not
set them.

### 5. Cloudflare Turnstile

[dash.cloudflare.com](https://dash.cloudflare.com) → Turnstile → Add site.
Domain: `chemicaldynamicsqatar.com`. Widget mode: **Managed**.

You get two keys. The **site key** goes in `careers.html`; the **secret key**
goes in `TURNSTILE_SECRET` above. Free, no account limits at this volume, and
unlike reCAPTCHA it usually shows nothing at all to a real applicant.

### 6. Create the HR accounts

**Authentication → Users → Add user**, with "Auto Confirm User" ticked. Then
grant admin rights — the account can sign in without this, but sees nothing:

```sql
insert into public.admins (user_id, email)
select id, email from auth.users where email = 'hr@chemicaldynamicsqatar.com';
```

Then, in **Authentication → Providers → Email**, turn **off** "Enable Sign Ups".
Otherwise anyone can create an account. They would land on an empty dashboard
either way, but there is no reason to allow it.

**Enable MFA.** Each admin enrols a TOTP app from their own device. Once every
admin has enrolled, you can require it at the database level:

```sql
-- Only after everyone has enrolled — this locks out anyone who has not.
drop policy if exists "admins read applications" on public.applications;
create policy "admins read applications"
  on public.applications for select to authenticated
  using (public.is_admin() and (auth.jwt() ->> 'aal') = 'aal2');
```

Revoking someone is one line: `delete from public.admins where email = '…';`.
It takes effect on their next request, not when their token expires.

### 7. Fill in the two config blocks

`careers.html`, near the bottom of the `<script>`:

```js
const CFG = {
  endpoint: 'https://YOUR-PROJECT-REF.supabase.co/functions/v1/submit-application',
  turnstileSiteKey: '0x4AAA…'
};
```

`admin.html`, same place:

```js
const CFG = {
  url:     'https://YOUR-PROJECT-REF.supabase.co',
  anonKey: 'eyJhbGci…'          // publishable / anon key — NOT service_role
};
```

If `turnstileSiteKey` is left empty the form still works and skips the bot check.
That is for review only. Do not launch that way.

### 8. Decide retention — do not skip this

Qatar's PDPPL (Law No. 13 of 2016) says personal data is kept no longer than its
purpose requires. A rejected candidate's passport scan has no purpose once the
vacancy closes.

`schema.sql` deliberately ships **no** retention job, because nobody should pick
that number quietly on CDE's behalf. Agree a period with CDE — 12 months after
last activity is the common answer — then schedule a deletion that removes the
**storage objects as well as the rows**. Deleting rows alone orphans four files
per applicant in the bucket forever.

Also enable the abandoned-submission purge, which is unambiguous:

```sql
select cron.schedule('purge-abandoned', '0 * * * *',
                     'select public.purge_abandoned_applications()');
```

---

## Testing before launch

1. Open `careers.html`, submit a complete application with four real files.
2. Check **Table Editor → applications**: one row, `status = 'new'`, four
   `doc_*` paths filled in.
3. Open `admin.html`, sign in, open the row, open each of the four documents.
4. **Try to break it.** In a private window with no session, from the browser
   console on the site's origin:
   ```js
   fetch('https://YOUR-REF.supabase.co/rest/v1/applications?select=*', {
     headers: { apikey: 'YOUR-ANON-KEY', authorization: 'Bearer YOUR-ANON-KEY' }
   }).then(r => r.json()).then(console.log)
   ```
   Expect `[]`. If it returns rows, RLS did not apply — stop and re-run
   `schema.sql`.
5. Submit six applications in an hour from one connection; the sixth should be
   refused.
6. Confirm `careers.html` contains no key: `grep -i "eyJ\|service_role" careers.html`
   must print nothing.

## Still to do

- **Email notification on new applications.** Currently HR must open the
  dashboard to notice. A database webhook on insert into Resend or SendGrid is
  the usual fix, and takes about twenty minutes.
- **The vacancy list.** `careers.html` asks the applicant to type the position
  they want. If CDE keeps a list of open roles, that should become a dropdown.
- **CV parsing / search.** Full-text search across the free-text fields is a
  Postgres one-liner if the volume ever justifies it.
