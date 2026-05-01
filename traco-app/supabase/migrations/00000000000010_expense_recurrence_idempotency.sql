-- ============================================================================
-- Migration 10 — Idempotência da materialização de despesas recorrentes
-- Adiciona expenses.recurrence_id (FK pra expense_recurrences) + UNIQUE
-- ============================================================================

alter table public.expenses
  add column if not exists recurrence_id uuid references public.expense_recurrences(id) on delete set null;

-- UNIQUE parcial: garante que cada recurrence só gera 1 expense por data.
-- Cron pode rodar 2x no mesmo dia sem duplicar.
create unique index if not exists uniq_expense_recurrence_date
  on public.expenses (recurrence_id, date)
  where recurrence_id is not null;

create index if not exists idx_expenses_recurrence_today
  on public.expenses (tenant_id, date, recurrence_id)
  where recurrence_id is not null;
