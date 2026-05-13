-- =====================================================================
-- Traço — migração 14: log de follow-ups de clientes (loop de retorno)
-- =====================================================================

do $$ begin
  create type public.followup_channel as enum ('whatsapp', 'sms', 'phone', 'in_person');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.followup_outcome as enum (
    'pending',       -- contatada, ainda sem resposta
    'scheduled',     -- agendou retorno
    'declined',      -- disse que não vai voltar
    'no_response'    -- não respondeu após N dias
  );
exception when duplicate_object then null; end $$;

create table if not exists public.client_followups (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  contacted_at timestamptz not null default now(),
  channel public.followup_channel not null,
  outcome public.followup_outcome not null default 'pending',
  notes text,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Index pra busca "último follow-up de cliente X"
create index if not exists client_followups_client_contacted_idx
  on public.client_followups(client_id, contacted_at desc);

create index if not exists client_followups_tenant_outcome_idx
  on public.client_followups(tenant_id, outcome, contacted_at desc);

alter table public.client_followups enable row level security;

drop policy if exists client_followups_tenant_isolation on public.client_followups;
create policy client_followups_tenant_isolation on public.client_followups
  for all
  using (tenant_id = public.tenant_id())
  with check (tenant_id = public.tenant_id());

create or replace trigger client_followups_set_updated_at
  before update on public.client_followups
  for each row execute function public.set_updated_at();
