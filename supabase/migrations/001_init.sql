create extension if not exists pgcrypto;

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
  status text not null default 'active',
  learning_pack jsonb not null default '{}'::jsonb,
  strategy jsonb not null default '[]'::jsonb,
  strategy_version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  document_type text not null,
  document_date date,
  source text,
  storage_path text,
  mime_type text,
  sha256 text,
  content text,
  assessment jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.case_events (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.cases enable row level security;
alter table public.documents enable row level security;
alter table public.case_events enable row level security;

create policy "users manage own cases" on public.cases
for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "users manage own documents" on public.documents
for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "users read own events" on public.case_events
for select using (owner_id = auth.uid());

create policy "users create own events" on public.case_events
for insert with check (owner_id = auth.uid());

insert into storage.buckets (id, name, public)
values ('case-documents', 'case-documents', false)
on conflict (id) do nothing;

create policy "upload own case files" on storage.objects
for insert to authenticated
with check (
  bucket_id = 'case-documents' and
  (storage.foldername(name))[1] = (select auth.uid()::text)
);

create policy "read own case files" on storage.objects
for select to authenticated
using (
  bucket_id = 'case-documents' and
  (storage.foldername(name))[1] = (select auth.uid()::text)
);

create policy "delete own case files" on storage.objects
for delete to authenticated
using (
  bucket_id = 'case-documents' and
  (storage.foldername(name))[1] = (select auth.uid()::text)
);
