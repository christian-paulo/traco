-- ============================================================================
-- Migration 06 — Sistema de metas + gamificação
-- Tabelas: goals, achievements
-- Função: update_goal_progress(goal_id) — recalcula current_value
-- ============================================================================

-- 1. Enums
do $$
begin
  if not exists (select 1 from pg_type where typname = 'goal_type') then
    create type public.goal_type as enum (
      'revenue',
      'appointments',
      'new_clients',
      'recovered_clients',
      'custom'
    );
  end if;
  if not exists (select 1 from pg_type where typname = 'goal_period') then
    create type public.goal_period as enum ('week', 'month', 'quarter', 'year');
  end if;
  if not exists (select 1 from pg_type where typname = 'goal_status') then
    create type public.goal_status as enum ('active', 'achieved', 'failed', 'cancelled');
  end if;
  if not exists (select 1 from pg_type where typname = 'achievement_type') then
    create type public.achievement_type as enum (
      'first_client',
      'tenth_client',
      'hundredth_client',
      'first_recovery',
      'streak_7',
      'streak_30',
      'monthly_record',
      'goal_25',
      'goal_50',
      'goal_75',
      'goal_100',
      'big_recovery',
      'first_month_pro'
    );
  end if;
end$$;

-- 2. Tabela goals
create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  type public.goal_type not null,
  target_value numeric(14,2) not null check (target_value > 0),
  current_value numeric(14,2) not null default 0,
  period_type public.goal_period not null,
  start_date date not null,
  end_date date not null,
  status public.goal_status not null default 'active',
  title text not null,
  description text,
  achieved_at timestamptz,
  -- highest milestone reached (0/25/50/75/100) — usado pra evitar disparar achievements duplicados
  milestones_reached int not null default 0,
  -- cache da última análise IA (1 por dia por meta)
  ai_strategy_text text,
  ai_strategy_generated_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_date >= start_date)
);

create index if not exists idx_goals_tenant_status
  on public.goals (tenant_id, status);
create index if not exists idx_goals_tenant_period
  on public.goals (tenant_id, start_date, end_date);

-- 3. Tabela achievements
create table if not exists public.achievements (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  type public.achievement_type not null,
  goal_id uuid references public.goals(id) on delete set null,
  earned_at timestamptz not null default now(),
  context_data jsonb,
  shared boolean not null default false,
  -- evita duplicação por tenant + type + goal
  unique (tenant_id, type, goal_id)
);

create index if not exists idx_achievements_tenant_earned
  on public.achievements (tenant_id, earned_at desc);

-- 4. Trigger updated_at
create or replace function public.goals_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_goals_updated_at on public.goals;
create trigger trg_goals_updated_at
  before update on public.goals
  for each row execute function public.goals_set_updated_at();

-- 5. Função pra recalcular current_value de uma meta
create or replace function public.update_goal_progress(p_goal_id uuid)
returns numeric
language plpgsql
security invoker
as $$
declare
  g record;
  new_value numeric := 0;
begin
  select * into g from public.goals where id = p_goal_id;
  if not found then
    return 0;
  end if;

  case g.type
    when 'revenue' then
      select coalesce(sum(price), 0)::numeric into new_value
      from public.appointments
      where tenant_id = g.tenant_id
        and status = 'completed'
        and performed_at::date >= g.start_date
        and performed_at::date <= g.end_date;
    when 'appointments' then
      select count(*)::numeric into new_value
      from public.appointments
      where tenant_id = g.tenant_id
        and status = 'completed'
        and performed_at::date >= g.start_date
        and performed_at::date <= g.end_date;
    when 'new_clients' then
      select count(*)::numeric into new_value
      from public.clients
      where tenant_id = g.tenant_id
        and created_at::date >= g.start_date
        and created_at::date <= g.end_date;
    when 'recovered_clients' then
      -- Clientes que receberam recovery email no período E voltaram a agendar depois
      select count(distinct c.id)::numeric into new_value
      from public.clients c
      join public.appointments a on a.client_id = c.id and a.tenant_id = c.tenant_id
      where c.tenant_id = g.tenant_id
        and c.last_recovery_email_sent_at is not null
        and a.performed_at >= c.last_recovery_email_sent_at
        and a.performed_at::date >= g.start_date
        and a.performed_at::date <= g.end_date;
    else
      -- 'custom' não recalcula automaticamente
      new_value := g.current_value;
  end case;

  update public.goals
  set current_value = new_value,
      status = case
        when new_value >= target_value and status = 'active' then 'achieved'::public.goal_status
        else status
      end,
      achieved_at = case
        when new_value >= target_value and achieved_at is null then now()
        else achieved_at
      end
  where id = p_goal_id;

  return new_value;
end;
$$;

-- 6. Função pra recalcular todas metas ativas de um tenant
create or replace function public.refresh_active_goals(p_tenant_id uuid)
returns int
language plpgsql
security invoker
as $$
declare
  count_updated int := 0;
  rec record;
begin
  for rec in
    select id from public.goals
    where tenant_id = p_tenant_id and status = 'active'
  loop
    perform public.update_goal_progress(rec.id);
    count_updated := count_updated + 1;
  end loop;
  return count_updated;
end;
$$;

-- 7. Trigger ao concluir appointment: recalcula metas ativas do tenant
create or replace function public.appointments_refresh_goals()
returns trigger
language plpgsql
as $$
begin
  if (tg_op = 'INSERT' and new.status = 'completed')
     or (tg_op = 'UPDATE' and new.status = 'completed' and (old.status is distinct from new.status or old.price is distinct from new.price)) then
    perform public.refresh_active_goals(new.tenant_id);
  end if;
  return new;
end;
$$;

drop trigger if exists trg_appointments_refresh_goals on public.appointments;
create trigger trg_appointments_refresh_goals
  after insert or update on public.appointments
  for each row execute function public.appointments_refresh_goals();

-- 8. RLS
alter table public.goals enable row level security;
alter table public.achievements enable row level security;

drop policy if exists goals_select_auth on public.goals;
create policy goals_select_auth on public.goals
  for select to authenticated using (tenant_id = public.tenant_id());

drop policy if exists goals_insert_auth on public.goals;
create policy goals_insert_auth on public.goals
  for insert to authenticated with check (tenant_id = public.tenant_id());

drop policy if exists goals_update_auth on public.goals;
create policy goals_update_auth on public.goals
  for update to authenticated using (tenant_id = public.tenant_id());

drop policy if exists goals_delete_auth on public.goals;
create policy goals_delete_auth on public.goals
  for delete to authenticated using (tenant_id = public.tenant_id());

drop policy if exists achievements_select_auth on public.achievements;
create policy achievements_select_auth on public.achievements
  for select to authenticated using (tenant_id = public.tenant_id());

drop policy if exists achievements_insert_auth on public.achievements;
create policy achievements_insert_auth on public.achievements
  for insert to authenticated with check (tenant_id = public.tenant_id());

drop policy if exists achievements_update_auth on public.achievements;
create policy achievements_update_auth on public.achievements
  for update to authenticated using (tenant_id = public.tenant_id());

drop policy if exists achievements_delete_auth on public.achievements;
create policy achievements_delete_auth on public.achievements
  for delete to authenticated using (tenant_id = public.tenant_id());
