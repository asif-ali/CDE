-- =====================================================================
--  CDE Careers — database schema
--  Run once, in the Supabase SQL editor, on a fresh project.
--
--  SECURITY MODEL, in one paragraph, because everything below depends on it:
--  the browser is never trusted and never holds a secret. Anonymous visitors
--  get NO policy on any table here, so the `anon` role cannot read, update or
--  delete a single row even holding the publishable key. Applications are
--  written only by the `submit-application` Edge Function, which runs on
--  Supabase's servers under the service role and therefore bypasses RLS.
--  Admins read through their own Auth session, gated on membership of the
--  `admins` table. There is no client-side authorisation check anywhere in
--  this system, so there is nothing a user can edit out of the JavaScript.
-- =====================================================================


-- ---------------------------------------------------------------------
--  1. Admins
-- ---------------------------------------------------------------------
-- Membership of this table is what makes an Auth user an admin. It is
-- deliberately NOT a column on auth.users or a JWT claim: a claim is baked
-- into a token at login and stays valid until the token expires, so revoking
-- someone would take up to an hour to bite. A table lookup revokes instantly.

create table if not exists public.admins (
  user_id  uuid primary key references auth.users(id) on delete cascade,
  email    text,
  added_at timestamptz not null default now()
);

alter table public.admins enable row level security;

-- An admin may confirm their own membership (the dashboard uses this to decide
-- whether to render). They cannot enumerate other admins, and cannot write —
-- adding an admin is a deliberate act performed in the Supabase dashboard.
drop policy if exists "admins see own row" on public.admins;
create policy "admins see own row"
  on public.admins for select
  to authenticated
  using (user_id = auth.uid());

-- SECURITY DEFINER so the check itself can read `admins` regardless of the
-- caller's policies. search_path is pinned — without it, a user-created schema
-- earlier on the path could shadow `admins` and spoof the answer.
create or replace function public.is_admin()
  returns boolean
  language sql
  stable
  security definer
  set search_path = public, pg_temp
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

revoke execute on function public.is_admin() from public, anon;
grant  execute on function public.is_admin() to authenticated;


-- ---------------------------------------------------------------------
--  2. Applications
-- ---------------------------------------------------------------------
create table if not exists public.applications (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),

  -- 'pending_upload' means the row exists but the four documents have not
  -- finished uploading yet. The dashboard hides these: a half-submitted
  -- application is noise, not a candidate. See the cleanup job at the bottom.
  status text not null default 'pending_upload'
    check (status in ('pending_upload','new','shortlisted','interviewed','rejected','hired')),

  position_applied      text not null,

  -- personal
  full_name             text not null,
  fathers_name          text,
  email                 text not null,
  mobile                text not null,
  nationality           text,
  date_of_birth         date,

  -- identification
  qid_number            text,
  qid_expiry            date,
  passport_number       text,
  passport_expiry       date,
  occupation_on_qid     text,
  visa_status           text,

  -- address in Qatar
  address               text,
  city                  text,

  -- experience & availability
  years_experience      numeric(4,1),
  expected_salary       text,
  current_employer      text,
  previous_employers    text,
  driving_license       text,
  highest_qualification text,
  available_from        date,
  notes                 text,

  -- storage object paths inside the private `applicant-docs` bucket.
  -- Paths, never URLs: a stored URL would eventually be pasted somewhere it
  -- outlives its signature. These are signed on demand, for 60 seconds.
  doc_qid               text,
  doc_photo             text,
  doc_cv                text,
  doc_residence         text,

  -- PDPPL: consent must be recorded, not assumed. The Edge Function rejects
  -- a submission without it, and this column is the evidence.
  consent_given         boolean not null default false,

  -- One-time secret returned to the browser at step 1 and required to finalise
  -- at step 3. Stops anyone flipping an arbitrary id to 'new'. Nulled on use.
  -- Nullable *and* defaulted: it is generated on insert and set back to NULL
  -- by the finish step, which is what makes that step un-replayable.
  upload_token          uuid default gen_random_uuid(),

  -- Truncated SHA-256 of (IP + a server-side salt). Enough to rate-limit and
  -- to spot a flood; not enough to be a stored identifier of a person.
  submitted_ip_hash     text,

  -- HR workflow
  admin_notes           text,
  reviewed_by           uuid references auth.users(id),
  reviewed_at           timestamptz
);

create index if not exists applications_created_idx on public.applications (created_at desc);
create index if not exists applications_status_idx  on public.applications (status);
create index if not exists applications_iphash_idx  on public.applications (submitted_ip_hash, created_at desc);

alter table public.applications enable row level security;

-- NOTE the absence of any `to anon` policy. That absence IS the security
-- boundary for the public form. Do not add one.

drop policy if exists "admins read applications" on public.applications;
create policy "admins read applications"
  on public.applications for select
  to authenticated
  using (public.is_admin());

drop policy if exists "admins update applications" on public.applications;
create policy "admins update applications"
  on public.applications for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Column-level grants narrow that UPDATE to the workflow fields. Without this
-- an admin policy would also permit rewriting an applicant's name or QID —
-- the dashboard would never do it, but the grant is what makes it impossible.
revoke update on public.applications from authenticated;
grant  update (status, admin_notes, reviewed_by, reviewed_at)
  on public.applications to authenticated;

-- Deletion is not granted to anyone. Removing an application is a retention
-- decision (see section 5), performed deliberately, not a button in a UI.


-- ---------------------------------------------------------------------
--  3. Audit trail
-- ---------------------------------------------------------------------
-- PDPPL expects you to be able to say who touched a candidate's record.
-- Append-only: admins may read it, nobody holds INSERT/UPDATE/DELETE — rows
-- arrive through the SECURITY DEFINER trigger below and cannot be edited after.

create table if not exists public.application_audit (
  id         bigserial primary key,
  at         timestamptz not null default now(),
  application_id uuid references public.applications(id) on delete cascade,
  actor      uuid,
  action     text not null,
  detail     jsonb
);

alter table public.application_audit enable row level security;

drop policy if exists "admins read audit" on public.application_audit;
create policy "admins read audit"
  on public.application_audit for select
  to authenticated
  using (public.is_admin());

create or replace function public.log_application_change()
  returns trigger
  language plpgsql
  security definer
  set search_path = public, pg_temp
as $$
begin
  if new.status is distinct from old.status
     or new.admin_notes is distinct from old.admin_notes then
    insert into public.application_audit (application_id, actor, action, detail)
    values (
      new.id,
      auth.uid(),
      case when new.status is distinct from old.status then 'status_change' else 'note_edit' end,
      jsonb_build_object('from', old.status, 'to', new.status)
    );
  end if;
  return new;
end;
$$;

drop trigger if exists application_audit_trg on public.applications;
create trigger application_audit_trg
  after update on public.applications
  for each row execute function public.log_application_change();


-- ---------------------------------------------------------------------
--  4. Document storage
-- ---------------------------------------------------------------------
-- Private bucket. `public: false` is the difference between a QID scan that
-- needs a signed request and one that is a guessable URL away from Google's
-- index. The 10MB ceiling is enforced here as well as in the Edge Function and
-- the browser, because only this one cannot be bypassed.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'applicant-docs', 'applicant-docs', false, 10485760,
  array['image/jpeg','image/png','image/webp','application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
on conflict (id) do update
  set public             = false,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Admins may read objects. Nobody — including admins — may write or delete
-- through the API: uploads arrive only via one-time signed upload URLs minted
-- by the Edge Function, which runs as the service role and bypasses RLS.
drop policy if exists "admins read applicant docs" on storage.objects;
create policy "admins read applicant docs"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'applicant-docs' and public.is_admin());


-- ---------------------------------------------------------------------
--  5. Housekeeping
-- ---------------------------------------------------------------------
-- Abandoned submissions: a row is created before the files upload, so a
-- visitor who closes the tab mid-upload leaves one behind. Anything still
-- 'pending_upload' after an hour never completed.
create or replace function public.purge_abandoned_applications()
  returns void
  language sql
  security definer
  set search_path = public, pg_temp
as $$
  delete from public.applications
   where status = 'pending_upload'
     and created_at < now() - interval '1 hour';
$$;

-- Optional, and worth doing — schedule it once pg_cron is enabled:
--   select cron.schedule('purge-abandoned', '0 * * * *',
--                        'select public.purge_abandoned_applications()');

-- RETENTION. PDPPL says personal data is kept no longer than the purpose
-- requires, and a rejected candidate's passport scan has no purpose after the
-- vacancy closes. Agree a period with CDE (12 months is the usual choice),
-- then schedule a deletion that removes the storage objects as well as the
-- rows — dropping the row alone orphans four files in the bucket forever.
-- Left unscheduled on purpose: nobody should silently pick that number.
