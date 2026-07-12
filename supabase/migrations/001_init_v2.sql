-- DAVA OS - Supabase ilk kurulum şeması
-- Supabase Dashboard > SQL Editor > New query ekranına tamamını yapıştırıp Run'a basın.

create extension if not exists pgcrypto;

-- ------------------------------------------------------------
-- 1) DAVA DOSYALARI
-- ------------------------------------------------------------
create table if not exists public.cases (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  case_type text not null,
  court text,
  file_number text,
  client_side text,
  objective text,
  summary text,
  status text not null default 'active'
    check (status in ('active', 'waiting', 'appeal', 'closed', 'archived')),
  learning_status text not null default 'pending'
    check (learning_status in ('pending', 'running', 'completed', 'failed')),
  learning_pack jsonb not null default '{}'::jsonb,
  strategy jsonb not null default '{}'::jsonb,
  strategy_version integer not null default 1 check (strategy_version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists cases_owner_id_idx on public.cases(owner_id);
create index if not exists cases_owner_status_idx on public.cases(owner_id, status);
create index if not exists cases_file_number_idx on public.cases(file_number);

-- ------------------------------------------------------------
-- 2) BELGELER
-- ------------------------------------------------------------
create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  document_type text not null,
  document_date date,
  source text,
  storage_path text,
  original_filename text,
  mime_type text,
  file_size_bytes bigint check (file_size_bytes is null or file_size_bytes >= 0),
  sha256 text,
  extraction_status text not null default 'pending'
    check (extraction_status in ('pending', 'processing', 'completed', 'failed')),
  content text,
  assessment jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (case_id, sha256)
);

create index if not exists documents_owner_id_idx on public.documents(owner_id);
create index if not exists documents_case_id_idx on public.documents(case_id);
create index if not exists documents_document_date_idx on public.documents(document_date);

-- ------------------------------------------------------------
-- 3) DAVA OLAYLARI / İŞLEM GEÇMİŞİ
-- ------------------------------------------------------------
create table if not exists public.case_events (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  document_id uuid references public.documents(id) on delete set null,
  event_type text not null,
  title text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists case_events_owner_id_idx on public.case_events(owner_id);
create index if not exists case_events_case_id_created_idx
  on public.case_events(case_id, created_at desc);

-- ------------------------------------------------------------
-- 4) GÖREVLER VE SÜRELER
-- ------------------------------------------------------------
create table if not exists public.case_tasks (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  due_at timestamptz,
  priority text not null default 'medium'
    check (priority in ('low', 'medium', 'high', 'critical')),
  status text not null default 'open'
    check (status in ('open', 'in_progress', 'completed', 'cancelled')),
  source_document_id uuid references public.documents(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists case_tasks_owner_id_idx on public.case_tasks(owner_id);
create index if not exists case_tasks_case_due_idx on public.case_tasks(case_id, due_at);

-- ------------------------------------------------------------
-- 5) UPDATED_AT TETİKLEYİCİSİ
-- ------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_cases_updated_at on public.cases;
create trigger set_cases_updated_at
before update on public.cases
for each row execute function public.set_updated_at();

drop trigger if exists set_documents_updated_at on public.documents;
create trigger set_documents_updated_at
before update on public.documents
for each row execute function public.set_updated_at();

drop trigger if exists set_case_tasks_updated_at on public.case_tasks;
create trigger set_case_tasks_updated_at
before update on public.case_tasks
for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- 6) ROW LEVEL SECURITY
-- ------------------------------------------------------------
alter table public.cases enable row level security;
alter table public.documents enable row level security;
alter table public.case_events enable row level security;
alter table public.case_tasks enable row level security;

-- Tekrar çalıştırılabilmesi için eski politikaları kaldır.
drop policy if exists "users select own cases" on public.cases;
drop policy if exists "users insert own cases" on public.cases;
drop policy if exists "users update own cases" on public.cases;
drop policy if exists "users delete own cases" on public.cases;

create policy "users select own cases"
on public.cases for select to authenticated
using ((select auth.uid()) is not null and owner_id = (select auth.uid()));

create policy "users insert own cases"
on public.cases for insert to authenticated
with check ((select auth.uid()) is not null and owner_id = (select auth.uid()));

create policy "users update own cases"
on public.cases for update to authenticated
using (owner_id = (select auth.uid()))
with check (owner_id = (select auth.uid()));

create policy "users delete own cases"
on public.cases for delete to authenticated
using (owner_id = (select auth.uid()));

drop policy if exists "users select own documents" on public.documents;
drop policy if exists "users insert own documents" on public.documents;
drop policy if exists "users update own documents" on public.documents;
drop policy if exists "users delete own documents" on public.documents;

create policy "users select own documents"
on public.documents for select to authenticated
using (owner_id = (select auth.uid()));

create policy "users insert own documents"
on public.documents for insert to authenticated
with check (
  owner_id = (select auth.uid())
  and exists (
    select 1 from public.cases c
    where c.id = case_id and c.owner_id = (select auth.uid())
  )
);

create policy "users update own documents"
on public.documents for update to authenticated
using (owner_id = (select auth.uid()))
with check (owner_id = (select auth.uid()));

create policy "users delete own documents"
on public.documents for delete to authenticated
using (owner_id = (select auth.uid()));

drop policy if exists "users select own events" on public.case_events;
drop policy if exists "users insert own events" on public.case_events;
drop policy if exists "users delete own events" on public.case_events;

create policy "users select own events"
on public.case_events for select to authenticated
using (owner_id = (select auth.uid()));

create policy "users insert own events"
on public.case_events for insert to authenticated
with check (
  owner_id = (select auth.uid())
  and exists (
    select 1 from public.cases c
    where c.id = case_id and c.owner_id = (select auth.uid())
  )
);

create policy "users delete own events"
on public.case_events for delete to authenticated
using (owner_id = (select auth.uid()));

drop policy if exists "users select own tasks" on public.case_tasks;
drop policy if exists "users insert own tasks" on public.case_tasks;
drop policy if exists "users update own tasks" on public.case_tasks;
drop policy if exists "users delete own tasks" on public.case_tasks;

create policy "users select own tasks"
on public.case_tasks for select to authenticated
using (owner_id = (select auth.uid()));

create policy "users insert own tasks"
on public.case_tasks for insert to authenticated
with check (
  owner_id = (select auth.uid())
  and exists (
    select 1 from public.cases c
    where c.id = case_id and c.owner_id = (select auth.uid())
  )
);

create policy "users update own tasks"
on public.case_tasks for update to authenticated
using (owner_id = (select auth.uid()))
with check (owner_id = (select auth.uid()));

create policy "users delete own tasks"
on public.case_tasks for delete to authenticated
using (owner_id = (select auth.uid()));

-- Tarayıcı/mobil istemcinin tabloları kullanabilmesi için izinler.
grant usage on schema public to authenticated;
grant select, insert, update, delete on
  public.cases,
  public.documents,
  public.case_events,
  public.case_tasks
to authenticated;

-- ------------------------------------------------------------
-- 7) ÖZEL BELGE DEPOSU
-- Dosya yolu şu biçimde olmalıdır:
-- <kullanici_uuid>/<dava_uuid>/<dosya_adi>
-- ------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit)
values ('case-documents', 'case-documents', false, 52428800)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit;

drop policy if exists "users upload own case files" on storage.objects;
drop policy if exists "users read own case files" on storage.objects;
drop policy if exists "users update own case files" on storage.objects;
drop policy if exists "users delete own case files" on storage.objects;

create policy "users upload own case files"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'case-documents'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "users read own case files"
on storage.objects for select to authenticated
using (
  bucket_id = 'case-documents'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "users update own case files"
on storage.objects for update to authenticated
using (
  bucket_id = 'case-documents'
  and (storage.foldername(name))[1] = (select auth.uid())::text
)
with check (
  bucket_id = 'case-documents'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "users delete own case files"
on storage.objects for delete to authenticated
using (
  bucket_id = 'case-documents'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

-- Kurulum kontrolü
select
  'Dava OS veritabanı kurulumu tamamlandı' as sonuc,
  now() as tarih;
