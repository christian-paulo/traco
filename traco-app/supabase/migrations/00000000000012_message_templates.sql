-- =====================================================================
-- Traço — migração 12: templates de mensagem por categoria
-- =====================================================================

do $$ begin
  create type public.message_template_category as enum (
    'reminder',
    'aftercare',
    'recovery',
    'admin'
  );
exception when duplicate_object then null; end $$;

create table if not exists public.message_templates (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  category public.message_template_category not null,
  body text not null,
  is_default boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Apenas 1 default por categoria por tenant
create unique index if not exists message_templates_one_default_per_category
  on public.message_templates(tenant_id, category)
  where is_default;

create index if not exists message_templates_tenant_category_sort
  on public.message_templates(tenant_id, category, sort_order);

alter table public.message_templates enable row level security;

drop policy if exists message_templates_tenant_isolation on public.message_templates;
create policy message_templates_tenant_isolation on public.message_templates
  for all
  using (tenant_id = public.tenant_id())
  with check (tenant_id = public.tenant_id());

create or replace trigger message_templates_set_updated_at
  before update on public.message_templates
  for each row execute function public.set_updated_at();

-- Seeds default por categoria pra cada tenant existente
do $$
declare t_id uuid;
begin
  for t_id in select id from public.tenants loop
    insert into public.message_templates (tenant_id, name, category, body, is_default, sort_order)
    select t_id, name, cat::public.message_template_category, body, true, 0
    from (values
      (
        'Lembrete de agendamento',
        'reminder',
        'Oi {cliente}! Tudo bem? Confirmando seu {procedimento} {data} às {hora} 💛 Qualquer coisa, me avisa por aqui!'
      ),
      (
        'Cuidados pós-procedimento',
        'aftercare',
        'Obrigada pela presença, {cliente}! 💛 Pra manter o resultado, evite molhar a região nas próximas 12h e não use maquiagem por 24h. Qualquer dúvida me chama!'
      ),
      (
        'Reativação',
        'recovery',
        coalesce(
          (select whatsapp_template from public.tenants where id = t_id),
          'Olá {cliente}! Vi que faz {dias} dias do seu último {procedimento}. Que tal agendar seu retorno? 💛'
        )
      ),
      (
        'Aviso geral',
        'admin',
        'Oi {cliente}! Aqui é a {designer} do {studio}. Tô passando pra te avisar que...'
      )
    ) as v(name, cat, body)
    on conflict do nothing;
  end loop;
end $$;

-- Seed automático para novos tenants
create or replace function public.seed_message_templates_for_tenant()
returns trigger as $$
begin
  insert into public.message_templates (tenant_id, name, category, body, is_default, sort_order) values
    (
      new.id,
      'Lembrete de agendamento',
      'reminder',
      'Oi {cliente}! Tudo bem? Confirmando seu {procedimento} {data} às {hora} 💛 Qualquer coisa, me avisa por aqui!',
      true,
      0
    ),
    (
      new.id,
      'Cuidados pós-procedimento',
      'aftercare',
      'Obrigada pela presença, {cliente}! 💛 Pra manter o resultado, evite molhar a região nas próximas 12h e não use maquiagem por 24h. Qualquer dúvida me chama!',
      true,
      0
    ),
    (
      new.id,
      'Reativação',
      'recovery',
      coalesce(new.whatsapp_template, 'Olá {cliente}! Vi que faz {dias} dias do seu último {procedimento}. Que tal agendar seu retorno? 💛'),
      true,
      0
    ),
    (
      new.id,
      'Aviso geral',
      'admin',
      'Oi {cliente}! Aqui é a {designer} do {studio}. Tô passando pra te avisar que...',
      true,
      0
    );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists tenants_seed_message_templates on public.tenants;
create trigger tenants_seed_message_templates
  after insert on public.tenants
  for each row execute function public.seed_message_templates_for_tenant();
