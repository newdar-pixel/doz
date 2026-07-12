-- Kullanıcının kendi AI sağlayıcı bağlantısı. API anahtarı yalnızca sunucu
-- tarafından AES-256 ile şifrelenmiş olarak saklanır; istemciye geri dönmez.
create table if not exists public.user_ai_connections (
  owner_id uuid primary key references auth.users(id) on delete cascade,
  provider text not null default 'openai' check (provider = 'openai'),
  encrypted_key text not null,
  iv text not null,
  auth_tag text not null,
  model text not null default 'gpt-5',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_ai_connections enable row level security;
-- Anahtar kasası doğrudan tarayıcıya açık değildir. Yalnızca Render API'sinin
-- service-role anahtarı kayıtları yönetir.
revoke all on public.user_ai_connections from anon, authenticated;

drop trigger if exists set_user_ai_connections_updated_at on public.user_ai_connections;
create trigger set_user_ai_connections_updated_at
before update on public.user_ai_connections
for each row execute function public.set_updated_at();
