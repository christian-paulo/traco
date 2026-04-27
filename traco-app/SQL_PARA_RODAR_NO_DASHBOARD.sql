-- =====================================================================
-- Traço — MVP-zero — schema inicial
-- =====================================================================

-- Extensões
create extension if not exists "uuid-ossp";
create extension if not exists pgcrypto;

-- =====================================================================
-- Tabelas
-- =====================================================================

create table public.tenants (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  email text not null,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.procedures (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  default_price numeric(10,2) not null default 0,
  default_return_days int not null default 30,
  color text not null default '#8B5CF6',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.clients (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  full_name text not null,
  phone text not null,
  email text,
  birth_date date,
  skin_phototype text,
  notes text,
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.appointments (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  procedure_id uuid not null references public.procedures(id) on delete restrict,
  performed_at timestamptz not null,
  price numeric(10,2) not null default 0,
  notes text,
  return_due_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.appointment_followups (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  appointment_id uuid not null unique references public.appointments(id) on delete cascade,
  water_glasses int,
  physical_activity text,
  aftercare_notes text,
  client_feedback text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.anamnesis_templates (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  fields jsonb not null default '[]'::jsonb,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.anamnesis_forms (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  template_id uuid not null references public.anamnesis_templates(id) on delete restrict,
  public_token text unique,
  status text not null default 'pending' check (status in ('pending','signed','expired')),
  answers jsonb,
  signature_png text,
  signed_at timestamptz,
  signer_ip text,
  integrity_hash text,
  pdf_url text,
  expires_at timestamptz not null default now() + interval '7 days',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.photos (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  storage_path text not null,
  procedure_id uuid references public.procedures(id) on delete set null,
  taken_at timestamptz not null default now(),
  notes text,
  is_key_photo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =====================================================================
-- Índices
-- =====================================================================

create index idx_profiles_tenant_id on public.profiles(tenant_id);
create index idx_procedures_tenant_id on public.procedures(tenant_id);
create index idx_clients_tenant_id on public.clients(tenant_id);
create index idx_clients_full_name on public.clients(tenant_id, full_name);
create index idx_appointments_tenant_id on public.appointments(tenant_id);
create index idx_appointments_client_id on public.appointments(client_id);
create index idx_appointments_performed_at on public.appointments(tenant_id, performed_at desc);
create index idx_appointment_followups_tenant_id on public.appointment_followups(tenant_id);
create index idx_anamnesis_templates_tenant_id on public.anamnesis_templates(tenant_id);
create index idx_anamnesis_forms_tenant_id on public.anamnesis_forms(tenant_id);
create index idx_anamnesis_forms_client_id on public.anamnesis_forms(client_id);
create index idx_anamnesis_forms_status on public.anamnesis_forms(tenant_id, status);
create index idx_photos_tenant_id on public.photos(tenant_id);
create index idx_photos_client_id on public.photos(client_id);

-- =====================================================================
-- Funções helper
-- =====================================================================

CREATE OR REPLACE FUNCTION public.tenant_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select tenant_id from public.profiles where id = auth.uid()
$$;

grant execute on function public.tenant_id() to anon, authenticated, service_role;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- =====================================================================
-- Triggers de updated_at
-- =====================================================================

create trigger trg_tenants_updated_at before update on public.tenants
  for each row execute function public.set_updated_at();
create trigger trg_profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger trg_procedures_updated_at before update on public.procedures
  for each row execute function public.set_updated_at();
create trigger trg_clients_updated_at before update on public.clients
  for each row execute function public.set_updated_at();
create trigger trg_appointments_updated_at before update on public.appointments
  for each row execute function public.set_updated_at();
create trigger trg_appointment_followups_updated_at before update on public.appointment_followups
  for each row execute function public.set_updated_at();
create trigger trg_anamnesis_templates_updated_at before update on public.anamnesis_templates
  for each row execute function public.set_updated_at();
create trigger trg_anamnesis_forms_updated_at before update on public.anamnesis_forms
  for each row execute function public.set_updated_at();
create trigger trg_photos_updated_at before update on public.photos
  for each row execute function public.set_updated_at();

-- =====================================================================
-- Onboarding: cria tenant + profile + procedures + template ao registrar
-- =====================================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tenant_id uuid;
begin
  insert into public.tenants (name)
  values (coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)))
  returning id into v_tenant_id;

  insert into public.profiles (id, tenant_id, email, full_name, avatar_url)
  values (
    new.id,
    v_tenant_id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );

  insert into public.procedures (tenant_id, name, default_price, default_return_days, color) values
    (v_tenant_id, 'Brow Lamination', 180, 50, '#8B5CF6'),
    (v_tenant_id, 'Design + Henna', 80, 25, '#EC4899'),
    (v_tenant_id, 'Design Simples', 50, 20, '#F59E0B'),
    (v_tenant_id, 'Microblading', 1500, 365, '#10B981');

  insert into public.anamnesis_templates (tenant_id, name, is_default, fields)
  values (
    v_tenant_id,
    'Anamnese Master Brow',
    true,
    '[
      {"id":"f1","type":"text","label":"Nome completo","required":true},
      {"id":"f2","type":"text","label":"WhatsApp","required":true},
      {"id":"f3","type":"date","label":"Data de nascimento","required":false},
      {"id":"f4","type":"boolean","label":"Está usando isotretinoína (Roacutan) ou usou nos últimos 6 meses?","required":true},
      {"id":"f5","type":"boolean","label":"Está grávida ou amamentando?","required":true},
      {"id":"f6","type":"boolean","label":"Tem alergia a henna, pigmento ou látex?","required":true},
      {"id":"f7","type":"textarea","label":"Liste medicamentos em uso atualmente","required":false},
      {"id":"f8","type":"textarea","label":"Alguma doença de pele na região (dermatite, psoríase, rosácea)?","required":false},
      {"id":"f9","type":"select","label":"Fototipo de pele","options":["I - Branca extremamente clara","II - Branca clara","III - Branca morena","IV - Morena clara","V - Morena escura","VI - Negra"],"required":true},
      {"id":"f10","type":"boolean","label":"Autorizo o uso de fotos antes/depois para portfólio","required":true}
    ]'::jsonb
  );

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =====================================================================
-- Cálculo automático de return_due_date
-- =====================================================================

create or replace function public.calculate_return_date()
returns trigger
language plpgsql
as $$
declare
  v_days int;
begin
  select default_return_days into v_days
  from public.procedures
  where id = new.procedure_id;

  if v_days is not null then
    new.return_due_date = (new.performed_at::date + v_days);
  end if;

  return new;
end;
$$;

create trigger trg_appointments_return_date
  before insert or update of performed_at, procedure_id on public.appointments
  for each row execute function public.calculate_return_date();

-- =====================================================================
-- Geração automática de public_token + expires_at em anamnesis_forms
-- =====================================================================

create or replace function public.generate_public_token()
returns trigger
language plpgsql
as $$
begin
  if new.public_token is null then
    new.public_token = encode(gen_random_bytes(24), 'hex');
  end if;
  if new.expires_at is null then
    new.expires_at = now() + interval '7 days';
  end if;
  return new;
end;
$$;

create trigger trg_anamnesis_forms_token
  before insert on public.anamnesis_forms
  for each row execute function public.generate_public_token();

-- =====================================================================
-- Row Level Security
-- =====================================================================

alter table public.tenants enable row level security;
alter table public.profiles enable row level security;
alter table public.procedures enable row level security;
alter table public.clients enable row level security;
alter table public.appointments enable row level security;
alter table public.appointment_followups enable row level security;
alter table public.anamnesis_templates enable row level security;
alter table public.anamnesis_forms enable row level security;
alter table public.photos enable row level security;

-- tenants: apenas leitura do próprio tenant
create policy tenants_select on public.tenants
  for select to authenticated using (id = public.tenant_id());

-- profiles: usuário só vê e edita o próprio
create policy profiles_select on public.profiles
  for select to authenticated using (id = auth.uid());
create policy profiles_update on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- procedures
create policy procedures_select on public.procedures
  for select to authenticated using (tenant_id = public.tenant_id());
create policy procedures_insert on public.procedures
  for insert to authenticated with check (tenant_id = public.tenant_id());
create policy procedures_update on public.procedures
  for update to authenticated using (tenant_id = public.tenant_id()) with check (tenant_id = public.tenant_id());
create policy procedures_delete on public.procedures
  for delete to authenticated using (tenant_id = public.tenant_id());

-- clients
create policy clients_select on public.clients
  for select to authenticated using (tenant_id = public.tenant_id());
create policy clients_insert on public.clients
  for insert to authenticated with check (tenant_id = public.tenant_id());
create policy clients_update on public.clients
  for update to authenticated using (tenant_id = public.tenant_id()) with check (tenant_id = public.tenant_id());
create policy clients_delete on public.clients
  for delete to authenticated using (tenant_id = public.tenant_id());

-- appointments
create policy appointments_select on public.appointments
  for select to authenticated using (tenant_id = public.tenant_id());
create policy appointments_insert on public.appointments
  for insert to authenticated with check (tenant_id = public.tenant_id());
create policy appointments_update on public.appointments
  for update to authenticated using (tenant_id = public.tenant_id()) with check (tenant_id = public.tenant_id());
create policy appointments_delete on public.appointments
  for delete to authenticated using (tenant_id = public.tenant_id());

-- appointment_followups
create policy followups_select on public.appointment_followups
  for select to authenticated using (tenant_id = public.tenant_id());
create policy followups_insert on public.appointment_followups
  for insert to authenticated with check (tenant_id = public.tenant_id());
create policy followups_update on public.appointment_followups
  for update to authenticated using (tenant_id = public.tenant_id()) with check (tenant_id = public.tenant_id());
create policy followups_delete on public.appointment_followups
  for delete to authenticated using (tenant_id = public.tenant_id());

-- anamnesis_templates
create policy templates_select on public.anamnesis_templates
  for select to authenticated using (tenant_id = public.tenant_id());
create policy templates_insert on public.anamnesis_templates
  for insert to authenticated with check (tenant_id = public.tenant_id());
create policy templates_update on public.anamnesis_templates
  for update to authenticated using (tenant_id = public.tenant_id()) with check (tenant_id = public.tenant_id());
create policy templates_delete on public.anamnesis_templates
  for delete to authenticated using (tenant_id = public.tenant_id());

-- anamnesis_forms (auth + público via public_token)
create policy forms_select_auth on public.anamnesis_forms
  for select to authenticated using (tenant_id = public.tenant_id());
create policy forms_insert_auth on public.anamnesis_forms
  for insert to authenticated with check (tenant_id = public.tenant_id());
create policy forms_update_auth on public.anamnesis_forms
  for update to authenticated using (tenant_id = public.tenant_id()) with check (tenant_id = public.tenant_id());
create policy forms_delete_auth on public.anamnesis_forms
  for delete to authenticated using (tenant_id = public.tenant_id());

create policy forms_select_public on public.anamnesis_forms
  for select to anon
  using (public_token is not null and status = 'pending' and expires_at > now());
create policy forms_update_public on public.anamnesis_forms
  for update to anon
  using (public_token is not null and status = 'pending' and expires_at > now())
  with check (status in ('pending','signed'));

-- photos
create policy photos_select on public.photos
  for select to authenticated using (tenant_id = public.tenant_id());
create policy photos_insert on public.photos
  for insert to authenticated with check (tenant_id = public.tenant_id());
create policy photos_update on public.photos
  for update to authenticated using (tenant_id = public.tenant_id()) with check (tenant_id = public.tenant_id());
create policy photos_delete on public.photos
  for delete to authenticated using (tenant_id = public.tenant_id());

-- =====================================================================
-- Storage buckets
-- =====================================================================

insert into storage.buckets (id, name, public)
values
  ('photos', 'photos', false),
  ('anamnesis-pdfs', 'anamnesis-pdfs', false)
on conflict (id) do nothing;

create policy storage_photos_select on storage.objects
  for select to authenticated
  using (bucket_id = 'photos' and (storage.foldername(name))[1] = public.tenant_id()::text);
create policy storage_photos_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'photos' and (storage.foldername(name))[1] = public.tenant_id()::text);
create policy storage_photos_update on storage.objects
  for update to authenticated
  using (bucket_id = 'photos' and (storage.foldername(name))[1] = public.tenant_id()::text);
create policy storage_photos_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'photos' and (storage.foldername(name))[1] = public.tenant_id()::text);

create policy storage_pdfs_select on storage.objects
  for select to authenticated
  using (bucket_id = 'anamnesis-pdfs' and (storage.foldername(name))[1] = public.tenant_id()::text);
create policy storage_pdfs_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'anamnesis-pdfs' and (storage.foldername(name))[1] = public.tenant_id()::text);
create policy storage_pdfs_update on storage.objects
  for update to authenticated
  using (bucket_id = 'anamnesis-pdfs' and (storage.foldername(name))[1] = public.tenant_id()::text);
create policy storage_pdfs_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'anamnesis-pdfs' and (storage.foldername(name))[1] = public.tenant_id()::text);
