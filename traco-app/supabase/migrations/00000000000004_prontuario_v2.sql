-- =====================================================================
-- Traço — migração 04: prontuário v2
-- - Versionamento de fichas (anamnesis_form_versions, imutável p/ original)
-- - Reações clínicas (client_reactions)
-- - Detalhes técnicos do procedimento (appointment_procedures)
-- - Produtos favoritos (favorite_products)
-- - Notas profissionais (professional_notes)
-- - Atualização do template default da ficha (rico, com seções)
-- =====================================================================

-- =====================================================================
-- 1.1 — Tabela de versões da ficha
-- =====================================================================

create table if not exists public.anamnesis_form_versions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  form_id uuid not null references public.anamnesis_forms(id) on delete cascade,
  version_number int not null,
  is_original boolean not null default false,
  edit_reason text,
  edited_by uuid references public.profiles(id) on delete set null,
  answers jsonb not null,
  signature_png text,
  signed_at timestamptz,
  signer_ip text,
  integrity_hash text not null,
  created_at timestamptz not null default now()
);

create unique index if not exists idx_form_version_unique
  on public.anamnesis_form_versions(form_id, version_number);
create index if not exists idx_form_versions_form_id
  on public.anamnesis_form_versions(form_id);
create index if not exists idx_form_versions_tenant_id
  on public.anamnesis_form_versions(tenant_id);

alter table public.anamnesis_form_versions enable row level security;

drop policy if exists form_versions_tenant_isolation on public.anamnesis_form_versions;
create policy form_versions_tenant_isolation on public.anamnesis_form_versions
  for all to authenticated
  using (tenant_id = public.tenant_id())
  with check (tenant_id = public.tenant_id());

-- Trigger para impedir alteração da versão original
create or replace function public.prevent_original_version_update()
returns trigger
language plpgsql
as $$
begin
  if old.is_original = true then
    raise exception 'A versão original da ficha é imutável.';
  end if;
  return new;
end;
$$;

drop trigger if exists no_update_original_version on public.anamnesis_form_versions;
create trigger no_update_original_version
  before update on public.anamnesis_form_versions
  for each row execute function public.prevent_original_version_update();

-- =====================================================================
-- 1.2 — Atualizar tabela anamnesis_forms
-- =====================================================================

alter table public.anamnesis_forms
  add column if not exists current_version_id uuid references public.anamnesis_form_versions(id),
  add column if not exists edit_count int not null default 0;

-- =====================================================================
-- 1.3 — Tabela de reações clínicas
-- =====================================================================

create table if not exists public.client_reactions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  appointment_id uuid references public.appointments(id) on delete set null,

  reaction_type text not null
    check (reaction_type in ('allergy','irritation','hypersensitivity','positive_excellent','below_expected','other')),
  occurred_when text not null
    check (occurred_when in ('during','immediately_after','24_72h_after','late_1week_plus')),
  symptoms text not null,
  treatment text,
  status text not null default 'observation'
    check (status in ('active','resolved','observation')),

  photo_urls text[] not null default '{}',
  notes text,

  recorded_at timestamptz not null default now(),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_reactions_client_active
  on public.client_reactions(client_id) where status = 'active';
create index if not exists idx_reactions_appointment
  on public.client_reactions(appointment_id);
create index if not exists idx_reactions_tenant
  on public.client_reactions(tenant_id);

alter table public.client_reactions enable row level security;

drop policy if exists reactions_tenant_isolation on public.client_reactions;
create policy reactions_tenant_isolation on public.client_reactions
  for all to authenticated
  using (tenant_id = public.tenant_id())
  with check (tenant_id = public.tenant_id());

drop trigger if exists trg_client_reactions_updated_at on public.client_reactions;
create trigger trg_client_reactions_updated_at
  before update on public.client_reactions
  for each row execute function public.set_updated_at();

-- =====================================================================
-- 1.4 — Tabela de detalhes técnicos do procedimento
-- =====================================================================

create table if not exists public.appointment_procedures (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  appointment_id uuid not null unique references public.appointments(id) on delete cascade,

  products_used jsonb not null default '[]'::jsonb,
  step_times jsonb not null default '[]'::jsonb,
  technique text,
  technical_notes text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_appt_procedures_tenant
  on public.appointment_procedures(tenant_id);

alter table public.appointment_procedures enable row level security;

drop policy if exists appt_procedures_tenant_isolation on public.appointment_procedures;
create policy appt_procedures_tenant_isolation on public.appointment_procedures
  for all to authenticated
  using (tenant_id = public.tenant_id())
  with check (tenant_id = public.tenant_id());

drop trigger if exists trg_appt_procedures_updated_at on public.appointment_procedures;
create trigger trg_appt_procedures_updated_at
  before update on public.appointment_procedures
  for each row execute function public.set_updated_at();

-- =====================================================================
-- 1.5 — Tabela de produtos favoritos
-- =====================================================================

create table if not exists public.favorite_products (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  brand text not null,
  product text not null,
  category text
    check (category is null or category in ('reduction','neutralization','hydration','henna','tint','other')),
  default_step_time int,
  use_count int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_favorite_products_use_count
  on public.favorite_products(tenant_id, use_count desc);

alter table public.favorite_products enable row level security;

drop policy if exists favorite_products_tenant_isolation on public.favorite_products;
create policy favorite_products_tenant_isolation on public.favorite_products
  for all to authenticated
  using (tenant_id = public.tenant_id())
  with check (tenant_id = public.tenant_id());

-- =====================================================================
-- 1.6 — Tabela de notas profissionais
-- =====================================================================

create table if not exists public.professional_notes (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  appointment_id uuid references public.appointments(id) on delete set null,

  title text not null,
  content text not null,
  pinned boolean not null default false,

  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_notes_client_pinned
  on public.professional_notes(client_id, pinned desc, created_at desc);
create index if not exists idx_notes_tenant
  on public.professional_notes(tenant_id);

alter table public.professional_notes enable row level security;

drop policy if exists notes_tenant_isolation on public.professional_notes;
create policy notes_tenant_isolation on public.professional_notes
  for all to authenticated
  using (tenant_id = public.tenant_id())
  with check (tenant_id = public.tenant_id());

drop trigger if exists trg_professional_notes_updated_at on public.professional_notes;
create trigger trg_professional_notes_updated_at
  before update on public.professional_notes
  for each row execute function public.set_updated_at();

-- =====================================================================
-- 1.7 — Atualizar template default (Master Brow Lamination)
-- =====================================================================

update public.anamnesis_templates
set fields = '[
  {"id":"dados_pessoais","type":"section","label":"Dados pessoais"},
  {"id":"f_name","type":"text","label":"Nome completo","required":true,"prefilled_from":"client.full_name"},
  {"id":"f_birth","type":"date","label":"Data de nascimento","required":true},
  {"id":"f_phone","type":"phone","label":"Celular (WhatsApp)","required":true,"prefilled_from":"client.phone"},
  {"id":"f_cpf","type":"cpf","label":"CPF","required":true,"validation":"cpf"},
  {"id":"f_instagram","type":"text","label":"Instagram (@)","required":false},
  {"id":"f_address","type":"textarea","label":"Endereço completo","required":false,"rows":2},
  {"id":"f_referral","type":"text","label":"Como me conheceu?","required":false},

  {"id":"avaliacao_clinica","type":"section","label":"Avaliação clínica"},
  {"id":"f_gestante","type":"boolean","label":"É gestante?","required":true},
  {"id":"f_amamentando","type":"boolean","label":"Está amamentando?","required":true},
  {"id":"f_queda_pelo","type":"boolean","label":"Possui queda de pelo?","required":true},
  {"id":"f_doenca_dermato","type":"boolean_with_text","label":"Já teve/tem alguma doença dermatológica?","required":true,"text_label":"Qual?"},
  {"id":"f_acidos","type":"boolean_with_text","label":"Faz uso de ácido / Roacutan / peeling?","required":true,"text_label":"Qual?"},
  {"id":"f_dermatite","type":"boolean","label":"Tem dermatite?","required":true},
  {"id":"f_alergia_cosmetico","type":"boolean_with_text","label":"Possui ou já teve alergia a algum cosmético?","required":true,"text_label":"Qual?"},
  {"id":"f_laser_sobrancelha","type":"boolean","label":"Está fazendo despigmentação a laser na sobrancelha?","required":true},
  {"id":"f_tinta_cabelo","type":"boolean","label":"Tinge a sobrancelha com tinta de cabelo?","required":true},

  {"id":"tipo_pele","type":"section","label":"Sobre sua pele"},
  {"id":"f_tipo_pele","type":"select","label":"Tipo de pele","required":false,"options":["Oleosa","Mista","Seca","Sensível","Normal"],"help":"Se não souber, deixe em branco — preenchemos juntas no atendimento"},

  {"id":"estilo_vida","type":"section","label":"Estilo de vida (opcional)","subtitle":"Estas perguntas são opcionais. Você pode preencher agora ou durante o atendimento."},
  {"id":"f_agua","type":"select","label":"Quantos litros de água por dia?","required":false,"options":["Menos de 1L","1L a 1,5L","1,5L a 2L","Mais de 2L"]},
  {"id":"f_sono","type":"select","label":"Horas de sono por noite","required":false,"options":["Menos de 5h","5h a 6h","6h a 8h","Mais de 8h"]},
  {"id":"f_alimentacao","type":"select","label":"Como descreveria sua alimentação?","required":false,"options":["Pouco saudável","Razoável","Boa","Muito saudável"]},
  {"id":"f_atividade_fisica","type":"select","label":"Pratica atividade física?","required":false,"options":["Não pratico","1-2x por semana","3-4x por semana","5x ou mais por semana"]},
  {"id":"f_suplementos","type":"textarea","label":"Toma vitaminas ou suplementos? Liste:","required":false,"rows":2},

  {"id":"autorizacao","type":"section","label":"Autorização"},
  {"id":"f_autoriza_fotos","type":"boolean","label":"Autoriza fotos/vídeos do procedimento para portfólio?","required":true},

  {"id":"termo","type":"section","label":"Termo de responsabilidade"},
  {"id":"f_termo","type":"term_acceptance","label":"Termo","required":true,"term_text":"Afirmo que TODAS as informações acima são verdadeiras e que todos os riscos e cuidados foram passados pela profissional, não cabendo a ela responsabilidade por informações omitidas. Me comprometo a tomar todos os cuidados pós procedimento passados pela profissional. Estou ciente que caso haja algum tipo de alergia ou irritação devo procurar um médico da minha confiança."}
]'::jsonb
where is_default = true;
