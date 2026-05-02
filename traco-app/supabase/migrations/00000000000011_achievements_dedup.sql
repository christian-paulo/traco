-- ============================================================================
-- Migration 11 — Dedup achievements + partial unique index pra goal_id NULL
--
-- Bug: o UNIQUE(tenant_id, type, goal_id) da migration 06 não bloqueia
-- duplicatas quando goal_id IS NULL (Postgres trata NULL != NULL em UNIQUE).
-- Achievements absolutas (first_client, tenth_client, etc) acumulavam duplicadas.
-- ============================================================================

-- 1. Remove duplicatas existentes — mantém a mais antiga de cada grupo
delete from public.achievements
where id in (
  select id from (
    select
      id,
      row_number() over (
        partition by tenant_id, type, coalesce(goal_id::text, '__null__')
        order by earned_at asc, id asc
      ) as rn
    from public.achievements
  ) ranked
  where rn > 1
);

-- 2. Partial unique index pro caso goal_id IS NULL
-- Combina com o UNIQUE existente: agora ambos os casos são protegidos.
create unique index if not exists uniq_achievements_tenant_type_no_goal
  on public.achievements (tenant_id, type)
  where goal_id is null;
