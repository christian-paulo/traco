-- =====================================================================
-- Traço — migração 03: sistema de agendamento (inspirado no Fresha)
-- =====================================================================

-- =====================================================================
-- TABELAS NOVAS
-- =====================================================================

create table if not exists public.studios (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  slug text not null unique,
  address text,
  bio text,
  cover_image_url text,
  rating numeric(3,2) not null default 0,
  reviews_count int not null default 0,
  is_solo boolean not null default true,
  waitlist_enabled boolean not null default false,
  booking_buffer_minutes int not null default 0,
  timezone text not null default 'America/Sao_Paulo',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_studios_tenant_id on public.studios(tenant_id);
create index if not exists idx_studios_slug on public.studios(slug);

create table if not exists public.professionals (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  studio_id uuid not null references public.studios(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  display_name text not null,
  role_title text,
  avatar_url text,
  bio text,
  rating numeric(3,2) not null default 0,
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_professionals_tenant_id on public.professionals(tenant_id);
create index if not exists idx_professionals_studio_id on public.professionals(studio_id);

create table if not exists public.professional_services (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  professional_id uuid not null references public.professionals(id) on delete cascade,
  procedure_id uuid not null references public.procedures(id) on delete cascade,
  duration_minutes int not null default 60,
  custom_price numeric(10,2),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (professional_id, procedure_id)
);

create index if not exists idx_prof_services_tenant_id on public.professional_services(tenant_id);
create index if not exists idx_prof_services_prof_id on public.professional_services(professional_id);

create table if not exists public.working_hours (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  professional_id uuid not null references public.professionals(id) on delete cascade,
  day_of_week int not null check (day_of_week between 0 and 6),
  start_time time not null,
  end_time time not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (professional_id, day_of_week)
);

create index if not exists idx_working_hours_prof_id on public.working_hours(professional_id);

create table if not exists public.time_off (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  professional_id uuid not null references public.professionals(id) on delete cascade,
  start_at timestamptz not null,
  end_at timestamptz not null,
  reason text,
  is_recurring boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_at > start_at)
);

create index if not exists idx_time_off_prof_id on public.time_off(professional_id);
create index if not exists idx_time_off_range on public.time_off(start_at, end_at);

create table if not exists public.booking_drafts (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  studio_id uuid not null references public.studios(id) on delete cascade,
  professional_id uuid not null references public.professionals(id) on delete cascade,
  procedure_id uuid not null references public.procedures(id) on delete restrict,
  scheduled_start_at timestamptz not null,
  client_full_name text not null,
  client_phone text not null,
  client_email text,
  client_birth_date date,
  client_notes text,
  status text not null default 'pending'
    check (status in ('pending','confirmed','rejected','expired')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_booking_drafts_tenant_id on public.booking_drafts(tenant_id);
create index if not exists idx_booking_drafts_status on public.booking_drafts(tenant_id, status);

create table if not exists public.waitlist_entries (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  studio_id uuid not null references public.studios(id) on delete cascade,
  professional_id uuid references public.professionals(id) on delete set null,
  procedure_id uuid references public.procedures(id) on delete set null,
  preferred_date date not null,
  client_full_name text not null,
  client_phone text not null,
  client_email text,
  status text not null default 'waiting'
    check (status in ('waiting','contacted','fulfilled','expired')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_waitlist_tenant_id on public.waitlist_entries(tenant_id);
create index if not exists idx_waitlist_status on public.waitlist_entries(tenant_id, status);

-- =====================================================================
-- ALTERAÇÕES NA TABELA appointments
-- =====================================================================

alter table public.appointments
  add column if not exists professional_id uuid references public.professionals(id) on delete set null,
  add column if not exists scheduled_start_at timestamptz,
  add column if not exists scheduled_end_at timestamptz,
  add column if not exists status text not null default 'completed',
  add column if not exists source text not null default 'manual',
  add column if not exists notes_internal text;

do $$ begin
  alter table public.appointments
    add constraint appointments_status_check
    check (status in ('pending','confirmed','completed','cancelled','no_show','draft_from_public'));
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.appointments
    add constraint appointments_source_check
    check (source in ('manual','public_booking','recovery'));
exception when duplicate_object then null; end $$;

create index if not exists idx_appointments_scheduled_start
  on public.appointments(tenant_id, scheduled_start_at);
create index if not exists idx_appointments_professional
  on public.appointments(professional_id, scheduled_start_at);
create index if not exists idx_appointments_status
  on public.appointments(tenant_id, status);

-- =====================================================================
-- updated_at triggers
-- =====================================================================

create trigger trg_studios_updated_at before update on public.studios
  for each row execute function public.set_updated_at();
create trigger trg_professionals_updated_at before update on public.professionals
  for each row execute function public.set_updated_at();
create trigger trg_prof_services_updated_at before update on public.professional_services
  for each row execute function public.set_updated_at();
create trigger trg_working_hours_updated_at before update on public.working_hours
  for each row execute function public.set_updated_at();
create trigger trg_time_off_updated_at before update on public.time_off
  for each row execute function public.set_updated_at();
create trigger trg_booking_drafts_updated_at before update on public.booking_drafts
  for each row execute function public.set_updated_at();
create trigger trg_waitlist_updated_at before update on public.waitlist_entries
  for each row execute function public.set_updated_at();

-- =====================================================================
-- Trigger de prevenção de conflitos em appointments
-- =====================================================================

create or replace function public.prevent_appointment_conflicts()
returns trigger
language plpgsql
as $$
begin
  if new.scheduled_start_at is null
     or new.scheduled_end_at is null
     or new.professional_id is null
     or new.status in ('cancelled', 'no_show', 'draft_from_public')
  then
    return new;
  end if;

  -- conflito com outros appointments
  if exists (
    select 1 from public.appointments
    where professional_id = new.professional_id
      and id is distinct from new.id
      and status not in ('cancelled', 'no_show', 'draft_from_public')
      and scheduled_start_at is not null
      and scheduled_end_at is not null
      and tstzrange(scheduled_start_at, scheduled_end_at, '[)')
          && tstzrange(new.scheduled_start_at, new.scheduled_end_at, '[)')
  ) then
    raise exception 'Conflito de horário com outro atendimento.';
  end if;

  -- bloqueia se cair em time_off
  if exists (
    select 1 from public.time_off
    where professional_id = new.professional_id
      and tstzrange(start_at, end_at, '[)')
          && tstzrange(new.scheduled_start_at, new.scheduled_end_at, '[)')
  ) then
    raise exception 'Horário cai em uma folga ou bloqueio configurado.';
  end if;

  return new;
end;
$$;

create trigger trg_appointments_conflict_check
  before insert or update of scheduled_start_at, scheduled_end_at, professional_id, status
  on public.appointments
  for each row execute function public.prevent_appointment_conflicts();

-- =====================================================================
-- handle_new_user atualizado para criar studio + professional + horários
-- =====================================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tenant_id uuid;
  v_studio_id uuid;
  v_professional_id uuid;
  v_profile_id uuid;
  v_first_name text;
  v_proc_brow uuid;
  v_proc_henna uuid;
  v_proc_simples uuid;
  v_proc_micro uuid;
begin
  -- Tenant + profile
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
  )
  returning id into v_profile_id;

  v_first_name := lower(split_part(
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    ' ',
    1
  ));
  v_first_name := regexp_replace(v_first_name, '[^a-z0-9]+', '', 'g');
  if v_first_name = '' then
    v_first_name := substring(new.id::text, 1, 8);
  end if;

  -- Studio
  insert into public.studios (tenant_id, name, slug, is_solo, waitlist_enabled)
  values (
    v_tenant_id,
    coalesce(new.raw_user_meta_data->>'full_name', 'Studio'),
    v_first_name || '-' || substring(new.id::text, 1, 6),
    true,
    false
  )
  returning id into v_studio_id;

  -- Professional
  insert into public.professionals (
    tenant_id, studio_id, profile_id, display_name, is_active, sort_order
  )
  values (
    v_tenant_id,
    v_studio_id,
    v_profile_id,
    initcap(split_part(coalesce(new.raw_user_meta_data->>'full_name', new.email), ' ', 1)),
    true,
    0
  )
  returning id into v_professional_id;

  -- Procedures default
  insert into public.procedures (tenant_id, name, default_price, default_return_days, color)
  values (v_tenant_id, 'Brow Lamination', 180, 50, '#8B5CF6')
  returning id into v_proc_brow;

  insert into public.procedures (tenant_id, name, default_price, default_return_days, color)
  values (v_tenant_id, 'Design + Henna', 80, 25, '#EC4899')
  returning id into v_proc_henna;

  insert into public.procedures (tenant_id, name, default_price, default_return_days, color)
  values (v_tenant_id, 'Design Simples', 50, 20, '#F59E0B')
  returning id into v_proc_simples;

  insert into public.procedures (tenant_id, name, default_price, default_return_days, color)
  values (v_tenant_id, 'Microblading', 1500, 365, '#10B981')
  returning id into v_proc_micro;

  -- professional_services
  insert into public.professional_services (tenant_id, professional_id, procedure_id, duration_minutes)
  values
    (v_tenant_id, v_professional_id, v_proc_brow, 60),
    (v_tenant_id, v_professional_id, v_proc_henna, 45),
    (v_tenant_id, v_professional_id, v_proc_simples, 30),
    (v_tenant_id, v_professional_id, v_proc_micro, 120);

  -- working_hours: Seg-Sex 09-18, Sáb 09-14, Dom desativado
  insert into public.working_hours (tenant_id, professional_id, day_of_week, start_time, end_time, is_active)
  values
    (v_tenant_id, v_professional_id, 1, '09:00', '18:00', true),
    (v_tenant_id, v_professional_id, 2, '09:00', '18:00', true),
    (v_tenant_id, v_professional_id, 3, '09:00', '18:00', true),
    (v_tenant_id, v_professional_id, 4, '09:00', '18:00', true),
    (v_tenant_id, v_professional_id, 5, '09:00', '18:00', true),
    (v_tenant_id, v_professional_id, 6, '09:00', '14:00', true),
    (v_tenant_id, v_professional_id, 0, '09:00', '14:00', false);

  -- Anamnesis template
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

-- =====================================================================
-- Row Level Security — tenant scoped (autenticado)
-- =====================================================================

alter table public.studios enable row level security;
alter table public.professionals enable row level security;
alter table public.professional_services enable row level security;
alter table public.working_hours enable row level security;
alter table public.time_off enable row level security;
alter table public.booking_drafts enable row level security;
alter table public.waitlist_entries enable row level security;

-- studios
create policy studios_select_auth on public.studios
  for select to authenticated using (tenant_id = public.tenant_id());
create policy studios_insert_auth on public.studios
  for insert to authenticated with check (tenant_id = public.tenant_id());
create policy studios_update_auth on public.studios
  for update to authenticated using (tenant_id = public.tenant_id())
  with check (tenant_id = public.tenant_id());
create policy studios_delete_auth on public.studios
  for delete to authenticated using (tenant_id = public.tenant_id());

-- professionals
create policy professionals_select_auth on public.professionals
  for select to authenticated using (tenant_id = public.tenant_id());
create policy professionals_insert_auth on public.professionals
  for insert to authenticated with check (tenant_id = public.tenant_id());
create policy professionals_update_auth on public.professionals
  for update to authenticated using (tenant_id = public.tenant_id())
  with check (tenant_id = public.tenant_id());
create policy professionals_delete_auth on public.professionals
  for delete to authenticated using (tenant_id = public.tenant_id());

-- professional_services
create policy prof_services_select_auth on public.professional_services
  for select to authenticated using (tenant_id = public.tenant_id());
create policy prof_services_insert_auth on public.professional_services
  for insert to authenticated with check (tenant_id = public.tenant_id());
create policy prof_services_update_auth on public.professional_services
  for update to authenticated using (tenant_id = public.tenant_id())
  with check (tenant_id = public.tenant_id());
create policy prof_services_delete_auth on public.professional_services
  for delete to authenticated using (tenant_id = public.tenant_id());

-- working_hours
create policy working_hours_select_auth on public.working_hours
  for select to authenticated using (tenant_id = public.tenant_id());
create policy working_hours_insert_auth on public.working_hours
  for insert to authenticated with check (tenant_id = public.tenant_id());
create policy working_hours_update_auth on public.working_hours
  for update to authenticated using (tenant_id = public.tenant_id())
  with check (tenant_id = public.tenant_id());
create policy working_hours_delete_auth on public.working_hours
  for delete to authenticated using (tenant_id = public.tenant_id());

-- time_off
create policy time_off_select_auth on public.time_off
  for select to authenticated using (tenant_id = public.tenant_id());
create policy time_off_insert_auth on public.time_off
  for insert to authenticated with check (tenant_id = public.tenant_id());
create policy time_off_update_auth on public.time_off
  for update to authenticated using (tenant_id = public.tenant_id())
  with check (tenant_id = public.tenant_id());
create policy time_off_delete_auth on public.time_off
  for delete to authenticated using (tenant_id = public.tenant_id());

-- booking_drafts
create policy booking_drafts_select_auth on public.booking_drafts
  for select to authenticated using (tenant_id = public.tenant_id());
create policy booking_drafts_update_auth on public.booking_drafts
  for update to authenticated using (tenant_id = public.tenant_id())
  with check (tenant_id = public.tenant_id());
create policy booking_drafts_delete_auth on public.booking_drafts
  for delete to authenticated using (tenant_id = public.tenant_id());

-- waitlist_entries
create policy waitlist_select_auth on public.waitlist_entries
  for select to authenticated using (tenant_id = public.tenant_id());
create policy waitlist_update_auth on public.waitlist_entries
  for update to authenticated using (tenant_id = public.tenant_id())
  with check (tenant_id = public.tenant_id());
create policy waitlist_delete_auth on public.waitlist_entries
  for delete to authenticated using (tenant_id = public.tenant_id());

-- =====================================================================
-- Policies públicas (anônimo) — preparação pra /agendar/[slug]
-- =====================================================================

create policy studios_select_public on public.studios
  for select to anon using (is_solo = true);
create policy professionals_select_public on public.professionals
  for select to anon using (
    is_active = true
    and exists (select 1 from public.studios s where s.id = studio_id and s.is_solo = true)
  );
create policy prof_services_select_public on public.professional_services
  for select to anon using (
    is_active = true
    and exists (select 1 from public.professionals p where p.id = professional_id and p.is_active = true)
  );
create policy working_hours_select_public on public.working_hours
  for select to anon using (is_active = true);
create policy time_off_select_public on public.time_off
  for select to anon using (true);
create policy procedures_select_public on public.procedures
  for select to anon using (is_active = true);
create policy appointments_select_public_busy on public.appointments
  for select to anon using (
    scheduled_start_at is not null
    and status not in ('cancelled', 'no_show', 'draft_from_public')
  );
create policy booking_drafts_insert_public on public.booking_drafts
  for insert to anon with check (true);
create policy waitlist_insert_public on public.waitlist_entries
  for insert to anon with check (true);
