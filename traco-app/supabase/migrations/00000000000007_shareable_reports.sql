-- ============================================================================
-- Migration 07 — Relatórios compartilháveis com controle de privacidade
-- Tabelas: sharing_preferences (singleton por tenant) + generated_reports
-- Trigger: auto-cria preferences quando tenant é criado
-- ============================================================================

-- 1. Enums
do $$
begin
  if not exists (select 1 from pg_type where typname = 'sharing_template') then
    create type public.sharing_template as enum ('minimal', 'operational', 'full');
  end if;
  if not exists (select 1 from pg_type where typname = 'report_type') then
    create type public.report_type as enum (
      'daily',
      'weekly',
      'monthly',
      'achievement',
      'goal_milestone',
      'custom'
    );
  end if;
end$$;

-- 2. sharing_preferences (1 por tenant — UNIQUE)
create table if not exists public.sharing_preferences (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null unique references public.tenants(id) on delete cascade,
  -- Privacidade DEFAULT TRUE (nunca expõe financeiro sem consentimento explícito)
  never_show_revenue boolean not null default true,
  never_show_profit boolean not null default true,
  never_show_expenses boolean not null default true,
  default_template public.sharing_template not null default 'operational',
  watermark_enabled boolean not null default true,
  custom_brand_color text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. generated_reports (histórico)
create table if not exists public.generated_reports (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  report_type public.report_type not null,
  period_start date,
  period_end date,
  included_fields jsonb not null default '{}'::jsonb,
  storage_path text,
  image_url text,
  shared_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_generated_reports_tenant_created
  on public.generated_reports (tenant_id, created_at desc);

-- 4. Trigger updated_at em sharing_preferences
create or replace function public.sharing_preferences_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_sharing_preferences_updated_at on public.sharing_preferences;
create trigger trg_sharing_preferences_updated_at
  before update on public.sharing_preferences
  for each row execute function public.sharing_preferences_set_updated_at();

-- 5. Trigger: ao criar tenant, cria sharing_preferences com defaults
create or replace function public.tenants_create_sharing_preferences()
returns trigger
language plpgsql
as $$
begin
  insert into public.sharing_preferences (tenant_id)
  values (new.id)
  on conflict (tenant_id) do nothing;
  return new;
end;
$$;

drop trigger if exists trg_tenants_create_sharing_preferences on public.tenants;
create trigger trg_tenants_create_sharing_preferences
  after insert on public.tenants
  for each row execute function public.tenants_create_sharing_preferences();

-- 6. Backfill: tenants existentes que ainda não têm preferences
insert into public.sharing_preferences (tenant_id)
select id from public.tenants
on conflict (tenant_id) do nothing;

-- 7. RLS
alter table public.sharing_preferences enable row level security;
alter table public.generated_reports enable row level security;

drop policy if exists sharing_prefs_select_auth on public.sharing_preferences;
create policy sharing_prefs_select_auth on public.sharing_preferences
  for select to authenticated using (tenant_id = public.tenant_id());

drop policy if exists sharing_prefs_insert_auth on public.sharing_preferences;
create policy sharing_prefs_insert_auth on public.sharing_preferences
  for insert to authenticated with check (tenant_id = public.tenant_id());

drop policy if exists sharing_prefs_update_auth on public.sharing_preferences;
create policy sharing_prefs_update_auth on public.sharing_preferences
  for update to authenticated using (tenant_id = public.tenant_id());

drop policy if exists generated_reports_select_auth on public.generated_reports;
create policy generated_reports_select_auth on public.generated_reports
  for select to authenticated using (tenant_id = public.tenant_id());

drop policy if exists generated_reports_insert_auth on public.generated_reports;
create policy generated_reports_insert_auth on public.generated_reports
  for insert to authenticated with check (tenant_id = public.tenant_id());

drop policy if exists generated_reports_update_auth on public.generated_reports;
create policy generated_reports_update_auth on public.generated_reports
  for update to authenticated using (tenant_id = public.tenant_id());

drop policy if exists generated_reports_delete_auth on public.generated_reports;
create policy generated_reports_delete_auth on public.generated_reports
  for delete to authenticated using (tenant_id = public.tenant_id());

-- 8. Storage bucket público (precisa ser público pra Stories/Posts conseguirem buscar)
insert into storage.buckets (id, name, public)
values ('shared-reports', 'shared-reports', true)
on conflict (id) do nothing;

drop policy if exists "shared_reports_read_public" on storage.objects;
create policy "shared_reports_read_public" on storage.objects
  for select to public
  using (bucket_id = 'shared-reports');

drop policy if exists "shared_reports_insert_auth" on storage.objects;
create policy "shared_reports_insert_auth" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'shared-reports');

drop policy if exists "shared_reports_delete_auth" on storage.objects;
create policy "shared_reports_delete_auth" on storage.objects
  for delete to authenticated
  using (bucket_id = 'shared-reports');
