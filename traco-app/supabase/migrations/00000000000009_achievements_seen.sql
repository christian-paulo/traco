-- ============================================================================
-- Migration 09 — Coluna seen_at em achievements (notificações de conquistas novas)
-- ============================================================================

alter table public.achievements
  add column if not exists seen_at timestamptz;

create index if not exists idx_achievements_tenant_unseen
  on public.achievements (tenant_id, earned_at desc)
  where seen_at is null;
