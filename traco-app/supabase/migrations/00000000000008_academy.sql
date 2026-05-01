-- ============================================================================
-- Migration 08 — Academia Traço (cursos, aulas, progresso, anúncios)
-- + role em profiles + novos achievement types + seed inicial
-- ============================================================================

-- 1. Enums novos
do $$
begin
  if not exists (select 1 from pg_type where typname = 'course_plan') then
    create type public.course_plan as enum ('free', 'pro', 'studio');
  end if;
end$$;

-- Adiciona valores ao enum achievement_type (Postgres ADD VALUE é IF NOT EXISTS-friendly via DO block)
do $$
begin
  if not exists (
    select 1 from pg_enum e
    join pg_type t on e.enumtypid = t.oid
    where t.typname = 'achievement_type' and e.enumlabel = 'first_lesson_completed'
  ) then
    alter type public.achievement_type add value 'first_lesson_completed';
  end if;
  if not exists (
    select 1 from pg_enum e
    join pg_type t on e.enumtypid = t.oid
    where t.typname = 'achievement_type' and e.enumlabel = 'first_course_completed'
  ) then
    alter type public.achievement_type add value 'first_course_completed';
  end if;
  if not exists (
    select 1 from pg_enum e
    join pg_type t on e.enumtypid = t.oid
    where t.typname = 'achievement_type' and e.enumlabel = 'lessons_5_in_week'
  ) then
    alter type public.achievement_type add value 'lessons_5_in_week';
  end if;
  if not exists (
    select 1 from pg_enum e
    join pg_type t on e.enumtypid = t.oid
    where t.typname = 'achievement_type' and e.enumlabel = 'engaged_student'
  ) then
    alter type public.achievement_type add value 'engaged_student';
  end if;
  if not exists (
    select 1 from pg_enum e
    join pg_type t on e.enumtypid = t.oid
    where t.typname = 'achievement_type' and e.enumlabel = 'founder_traco'
  ) then
    alter type public.achievement_type add value 'founder_traco';
  end if;
end$$;

-- 2. Coluna role em profiles
alter table public.profiles
  add column if not exists role text not null default 'designer';

-- 3. Tabela courses (GLOBAL — sem tenant_id)
create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  description text,
  cover_image_url text,
  sort_order int not null default 0,
  required_plan public.course_plan not null default 'free',
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_courses_published on public.courses (is_published, sort_order);

-- 4. Tabela lessons (GLOBAL)
create table if not exists public.lessons (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null,
  description text,
  video_url text,
  duration_seconds int not null default 0,
  sort_order int not null default 0,
  resources_urls jsonb not null default '[]'::jsonb,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_lessons_course on public.lessons (course_id, sort_order);

-- 5. Tabela lesson_progress (POR ALUNA — tem tenant_id)
create table if not exists public.lesson_progress (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  watched_seconds int not null default 0,
  last_position_seconds int not null default 0,
  completed boolean not null default false,
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (tenant_id, lesson_id)
);

create index if not exists idx_lesson_progress_tenant
  on public.lesson_progress (tenant_id, completed);

-- 6. Tabela course_announcements (GLOBAL)
create table if not exists public.course_announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  linked_lesson_id uuid references public.lessons(id) on delete set null,
  published_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_course_announcements_published
  on public.course_announcements (published_at desc nulls last);

-- 7. Triggers updated_at
create or replace function public.academy_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_courses_updated_at on public.courses;
create trigger trg_courses_updated_at
  before update on public.courses
  for each row execute function public.academy_set_updated_at();

drop trigger if exists trg_lessons_updated_at on public.lessons;
create trigger trg_lessons_updated_at
  before update on public.lessons
  for each row execute function public.academy_set_updated_at();

drop trigger if exists trg_lesson_progress_updated_at on public.lesson_progress;
create trigger trg_lesson_progress_updated_at
  before update on public.lesson_progress
  for each row execute function public.academy_set_updated_at();

-- 8. RLS
alter table public.courses enable row level security;
alter table public.lessons enable row level security;
alter table public.lesson_progress enable row level security;
alter table public.course_announcements enable row level security;

-- Cursos publicados são SELECT pra usuários autenticados
drop policy if exists courses_select_auth on public.courses;
create policy courses_select_auth on public.courses
  for select to authenticated using (is_published = true);

drop policy if exists courses_admin_all on public.courses;
create policy courses_admin_all on public.courses
  for all to authenticated
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = (select auth.uid()) and profiles.role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.profiles
      where profiles.id = (select auth.uid()) and profiles.role = 'admin'
    )
  );

drop policy if exists lessons_select_auth on public.lessons;
create policy lessons_select_auth on public.lessons
  for select to authenticated using (
    is_published = true
    and exists (
      select 1 from public.courses c
      where c.id = lessons.course_id and c.is_published = true
    )
  );

drop policy if exists lessons_admin_all on public.lessons;
create policy lessons_admin_all on public.lessons
  for all to authenticated
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = (select auth.uid()) and profiles.role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.profiles
      where profiles.id = (select auth.uid()) and profiles.role = 'admin'
    )
  );

drop policy if exists lesson_progress_select_auth on public.lesson_progress;
create policy lesson_progress_select_auth on public.lesson_progress
  for select to authenticated using (tenant_id = public.tenant_id());

drop policy if exists lesson_progress_insert_auth on public.lesson_progress;
create policy lesson_progress_insert_auth on public.lesson_progress
  for insert to authenticated with check (tenant_id = public.tenant_id());

drop policy if exists lesson_progress_update_auth on public.lesson_progress;
create policy lesson_progress_update_auth on public.lesson_progress
  for update to authenticated using (tenant_id = public.tenant_id());

drop policy if exists course_announcements_select_auth on public.course_announcements;
create policy course_announcements_select_auth on public.course_announcements
  for select to authenticated using (published_at is not null);

drop policy if exists course_announcements_admin_all on public.course_announcements;
create policy course_announcements_admin_all on public.course_announcements
  for all to authenticated
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = (select auth.uid()) and profiles.role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.profiles
      where profiles.id = (select auth.uid()) and profiles.role = 'admin'
    )
  );

-- 9. SEED inicial — 3 cursos com aulas placeholder
-- Vimeo ID 76979871 = "Big Buck Bunny" (sample público da Vimeo)
-- Designer pode substituir via admin depois
do $$
declare
  c1 uuid;
  c2 uuid;
  c3 uuid;
begin
  -- Curso 1: Bem-vinda
  insert into public.courses (title, slug, description, sort_order, required_plan, is_published)
  values (
    'Bem-vinda ao Traço',
    'bem-vinda-traco',
    'Aulas curtas pra você começar com o pé direito no Traço. Da configuração ao primeiro atendimento.',
    1,
    'free',
    true
  )
  on conflict (slug) do update set updated_at = now()
  returning id into c1;

  insert into public.lessons (course_id, title, description, video_url, duration_seconds, sort_order, is_published)
  values
    (c1, 'Como configurar seus procedimentos', 'Catálogo, preços e tempos de retorno.', 'https://vimeo.com/76979871', 320, 1, true),
    (c1, 'Como cadastrar a primeira cliente', 'Tour pelo perfil completo.', 'https://vimeo.com/76979871', 280, 2, true),
    (c1, 'Como enviar a primeira ficha', 'Anamnese digital com assinatura legal.', 'https://vimeo.com/76979871', 360, 3, true),
    (c1, 'Como aplicar o Método SRB', 'Visão geral do método de retenção.', 'https://vimeo.com/76979871', 420, 4, true)
  on conflict do nothing;

  -- Curso 2: Método SRB Avançado
  insert into public.courses (title, slug, description, sort_order, required_plan, is_published)
  values (
    'Método SRB Avançado',
    'metodo-srb-avancado',
    'Aprofundamento nos 3 movimentos do Método SRB: Sustentação, Recuperação e Blindagem.',
    2,
    'pro',
    true
  )
  on conflict (slug) do update set updated_at = now()
  returning id into c2;

  insert into public.lessons (course_id, title, description, video_url, duration_seconds, sort_order, is_published)
  values
    (c2, 'Os 3 movimentos detalhados', 'O quadro completo do Método SRB.', 'https://vimeo.com/76979871', 600, 1, true),
    (c2, 'Como criar campanha de recuperação', 'Templates de email e WhatsApp que convertem.', 'https://vimeo.com/76979871', 540, 2, true),
    (c2, 'Métricas que importam', 'O que medir e o que ignorar no Traço.', 'https://vimeo.com/76979871', 480, 3, true)
  on conflict do nothing;

  -- Curso 3: Crescimento
  insert into public.courses (title, slug, description, sort_order, required_plan, is_published)
  values (
    'Crescimento do Studio',
    'crescimento-do-studio',
    'Estratégia de precificação, posicionamento e fidelização — pra evoluir do operacional ao estratégico.',
    3,
    'pro',
    true
  )
  on conflict (slug) do update set updated_at = now()
  returning id into c3;

  insert into public.lessons (course_id, title, description, video_url, duration_seconds, sort_order, is_published)
  values
    (c3, 'Precificação', 'Como calcular ticket e margem corretamente.', 'https://vimeo.com/76979871', 510, 1, true),
    (c3, 'Posicionamento no Instagram', 'Conteúdo que vende sem queimar valor.', 'https://vimeo.com/76979871', 600, 2, true),
    (c3, 'Fidelização', 'Construir clientela que volta espontaneamente.', 'https://vimeo.com/76979871', 480, 3, true)
  on conflict do nothing;
end$$;
