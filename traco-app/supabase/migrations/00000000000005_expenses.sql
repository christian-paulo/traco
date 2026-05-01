-- ============================================================================
-- Migration 05 — Sistema de despesas + recorrências
-- Tabelas: expenses, expense_recurrences
-- Storage bucket: expense-receipts
-- ============================================================================

-- 1. Enum de categorias
do $$
begin
  if not exists (select 1 from pg_type where typname = 'expense_category') then
    create type public.expense_category as enum (
      'products',
      'rent',
      'marketing',
      'transport',
      'equipment',
      'tax',
      'other'
    );
  end if;
end$$;

-- 2. Tabela expenses
create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  category public.expense_category not null default 'other',
  description text not null,
  amount numeric(12,2) not null check (amount >= 0),
  date date not null default current_date,
  is_recurring boolean not null default false,
  recurrence_pattern jsonb,
  receipt_url text,
  notes text,
  linked_product_id uuid references public.favorite_products(id) on delete set null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_expenses_tenant_date
  on public.expenses (tenant_id, date desc);
create index if not exists idx_expenses_tenant_category
  on public.expenses (tenant_id, category);

-- 3. Tabela expense_recurrences
create table if not exists public.expense_recurrences (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  parent_expense_id uuid not null references public.expenses(id) on delete cascade,
  next_due_date date not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists idx_expense_recurrences_due
  on public.expense_recurrences (tenant_id, next_due_date)
  where is_active = true;

-- 4. Trigger de updated_at em expenses
create or replace function public.expenses_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_expenses_updated_at on public.expenses;
create trigger trg_expenses_updated_at
  before update on public.expenses
  for each row execute function public.expenses_set_updated_at();

-- 5. Trigger: ao inserir expense com is_recurring=true, cria entry em expense_recurrences
create or replace function public.expenses_create_recurrence()
returns trigger
language plpgsql
as $$
declare
  pattern_type text;
  next_due date;
begin
  if new.is_recurring is not true then
    return new;
  end if;

  pattern_type := lower(coalesce(new.recurrence_pattern->>'type', 'monthly'));

  case pattern_type
    when 'weekly' then
      next_due := new.date + interval '7 days';
    when 'monthly' then
      next_due := (new.date + interval '1 month')::date;
    when 'yearly' then
      next_due := (new.date + interval '1 year')::date;
    else
      next_due := (new.date + interval '1 month')::date;
  end case;

  insert into public.expense_recurrences (tenant_id, parent_expense_id, next_due_date)
  values (new.tenant_id, new.id, next_due);

  return new;
end;
$$;

drop trigger if exists trg_expenses_recurrence on public.expenses;
create trigger trg_expenses_recurrence
  after insert on public.expenses
  for each row execute function public.expenses_create_recurrence();

-- 6. RLS
alter table public.expenses enable row level security;
alter table public.expense_recurrences enable row level security;

drop policy if exists expenses_select_auth on public.expenses;
create policy expenses_select_auth on public.expenses
  for select to authenticated using (tenant_id = public.tenant_id());

drop policy if exists expenses_insert_auth on public.expenses;
create policy expenses_insert_auth on public.expenses
  for insert to authenticated with check (tenant_id = public.tenant_id());

drop policy if exists expenses_update_auth on public.expenses;
create policy expenses_update_auth on public.expenses
  for update to authenticated using (tenant_id = public.tenant_id());

drop policy if exists expenses_delete_auth on public.expenses;
create policy expenses_delete_auth on public.expenses
  for delete to authenticated using (tenant_id = public.tenant_id());

drop policy if exists expense_recurrences_select_auth on public.expense_recurrences;
create policy expense_recurrences_select_auth on public.expense_recurrences
  for select to authenticated using (tenant_id = public.tenant_id());

drop policy if exists expense_recurrences_insert_auth on public.expense_recurrences;
create policy expense_recurrences_insert_auth on public.expense_recurrences
  for insert to authenticated with check (tenant_id = public.tenant_id());

drop policy if exists expense_recurrences_update_auth on public.expense_recurrences;
create policy expense_recurrences_update_auth on public.expense_recurrences
  for update to authenticated using (tenant_id = public.tenant_id());

drop policy if exists expense_recurrences_delete_auth on public.expense_recurrences;
create policy expense_recurrences_delete_auth on public.expense_recurrences
  for delete to authenticated using (tenant_id = public.tenant_id());

-- 7. Storage bucket pra notas fiscais
insert into storage.buckets (id, name, public)
values ('expense-receipts', 'expense-receipts', false)
on conflict (id) do nothing;

drop policy if exists "expense_receipts_read_auth" on storage.objects;
create policy "expense_receipts_read_auth" on storage.objects
  for select to authenticated
  using (bucket_id = 'expense-receipts');

drop policy if exists "expense_receipts_insert_auth" on storage.objects;
create policy "expense_receipts_insert_auth" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'expense-receipts');

drop policy if exists "expense_receipts_delete_auth" on storage.objects;
create policy "expense_receipts_delete_auth" on storage.objects
  for delete to authenticated
  using (bucket_id = 'expense-receipts');
