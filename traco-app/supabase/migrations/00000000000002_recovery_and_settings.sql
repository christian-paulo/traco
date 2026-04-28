-- =====================================================================
-- Traço — migração 02: clientes a recuperar + telefone designer + tenant settings
-- =====================================================================

-- Recovery email tracking
alter table public.clients
  add column if not exists last_recovery_email_sent_at timestamptz;

-- Telefone do profile (WhatsApp Business)
alter table public.profiles
  add column if not exists phone text;

-- Configurações do tenant
alter table public.tenants
  add column if not exists whatsapp_template text,
  add column if not exists accent_color text default '#C9A961';
