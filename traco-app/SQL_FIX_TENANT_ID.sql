-- =====================================================================
-- FIX: substitui auth.tenant_id() por public.tenant_id() em TODAS
-- as policies das tabelas antigas (criadas pela migration 01).
--
-- Use este SQL antes de rodar SQL_BOOKING_SYSTEM.sql.
-- Idempotente — pode rodar várias vezes.
-- =====================================================================

-- 1) Cria a função em public (substituto de auth.tenant_id)
create or replace function public.tenant_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select tenant_id from public.profiles where id = auth.uid()
$$;

grant execute on function public.tenant_id() to anon, authenticated, service_role;

-- 2) Drop policies antigas (se existirem)

-- tenants
drop policy if exists tenants_select on public.tenants;

-- profiles
drop policy if exists profiles_select on public.profiles;
drop policy if exists profiles_update on public.profiles;

-- procedures
drop policy if exists procedures_select on public.procedures;
drop policy if exists procedures_insert on public.procedures;
drop policy if exists procedures_update on public.procedures;
drop policy if exists procedures_delete on public.procedures;

-- clients
drop policy if exists clients_select on public.clients;
drop policy if exists clients_insert on public.clients;
drop policy if exists clients_update on public.clients;
drop policy if exists clients_delete on public.clients;

-- appointments
drop policy if exists appointments_select on public.appointments;
drop policy if exists appointments_insert on public.appointments;
drop policy if exists appointments_update on public.appointments;
drop policy if exists appointments_delete on public.appointments;

-- appointment_followups
drop policy if exists followups_select on public.appointment_followups;
drop policy if exists followups_insert on public.appointment_followups;
drop policy if exists followups_update on public.appointment_followups;
drop policy if exists followups_delete on public.appointment_followups;

-- anamnesis_templates
drop policy if exists templates_select on public.anamnesis_templates;
drop policy if exists templates_insert on public.anamnesis_templates;
drop policy if exists templates_update on public.anamnesis_templates;
drop policy if exists templates_delete on public.anamnesis_templates;

-- anamnesis_forms
drop policy if exists forms_select_auth on public.anamnesis_forms;
drop policy if exists forms_insert_auth on public.anamnesis_forms;
drop policy if exists forms_update_auth on public.anamnesis_forms;
drop policy if exists forms_delete_auth on public.anamnesis_forms;
drop policy if exists forms_select_public on public.anamnesis_forms;
drop policy if exists forms_update_public on public.anamnesis_forms;

-- photos
drop policy if exists photos_select on public.photos;
drop policy if exists photos_insert on public.photos;
drop policy if exists photos_update on public.photos;
drop policy if exists photos_delete on public.photos;

-- storage
drop policy if exists storage_photos_select on storage.objects;
drop policy if exists storage_photos_insert on storage.objects;
drop policy if exists storage_photos_update on storage.objects;
drop policy if exists storage_photos_delete on storage.objects;
drop policy if exists storage_pdfs_select on storage.objects;
drop policy if exists storage_pdfs_insert on storage.objects;
drop policy if exists storage_pdfs_update on storage.objects;
drop policy if exists storage_pdfs_delete on storage.objects;

-- 3) Recria policies usando public.tenant_id()

-- tenants
create policy tenants_select on public.tenants
  for select to authenticated using (id = public.tenant_id());

-- profiles
create policy profiles_select on public.profiles
  for select to authenticated using (id = auth.uid());
create policy profiles_update on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- procedures
create policy procedures_select on public.procedures
  for select to authenticated using (tenant_id = public.tenant_id());
create policy procedures_insert on public.procedures
  for insert to authenticated with check (tenant_id = public.tenant_id());
create policy procedures_update on public.procedures
  for update to authenticated using (tenant_id = public.tenant_id())
  with check (tenant_id = public.tenant_id());
create policy procedures_delete on public.procedures
  for delete to authenticated using (tenant_id = public.tenant_id());

-- clients
create policy clients_select on public.clients
  for select to authenticated using (tenant_id = public.tenant_id());
create policy clients_insert on public.clients
  for insert to authenticated with check (tenant_id = public.tenant_id());
create policy clients_update on public.clients
  for update to authenticated using (tenant_id = public.tenant_id())
  with check (tenant_id = public.tenant_id());
create policy clients_delete on public.clients
  for delete to authenticated using (tenant_id = public.tenant_id());

-- appointments
create policy appointments_select on public.appointments
  for select to authenticated using (tenant_id = public.tenant_id());
create policy appointments_insert on public.appointments
  for insert to authenticated with check (tenant_id = public.tenant_id());
create policy appointments_update on public.appointments
  for update to authenticated using (tenant_id = public.tenant_id())
  with check (tenant_id = public.tenant_id());
create policy appointments_delete on public.appointments
  for delete to authenticated using (tenant_id = public.tenant_id());

-- appointment_followups
create policy followups_select on public.appointment_followups
  for select to authenticated using (tenant_id = public.tenant_id());
create policy followups_insert on public.appointment_followups
  for insert to authenticated with check (tenant_id = public.tenant_id());
create policy followups_update on public.appointment_followups
  for update to authenticated using (tenant_id = public.tenant_id())
  with check (tenant_id = public.tenant_id());
create policy followups_delete on public.appointment_followups
  for delete to authenticated using (tenant_id = public.tenant_id());

-- anamnesis_templates
create policy templates_select on public.anamnesis_templates
  for select to authenticated using (tenant_id = public.tenant_id());
create policy templates_insert on public.anamnesis_templates
  for insert to authenticated with check (tenant_id = public.tenant_id());
create policy templates_update on public.anamnesis_templates
  for update to authenticated using (tenant_id = public.tenant_id())
  with check (tenant_id = public.tenant_id());
create policy templates_delete on public.anamnesis_templates
  for delete to authenticated using (tenant_id = public.tenant_id());

-- anamnesis_forms (auth + público via public_token)
create policy forms_select_auth on public.anamnesis_forms
  for select to authenticated using (tenant_id = public.tenant_id());
create policy forms_insert_auth on public.anamnesis_forms
  for insert to authenticated with check (tenant_id = public.tenant_id());
create policy forms_update_auth on public.anamnesis_forms
  for update to authenticated using (tenant_id = public.tenant_id())
  with check (tenant_id = public.tenant_id());
create policy forms_delete_auth on public.anamnesis_forms
  for delete to authenticated using (tenant_id = public.tenant_id());

create policy forms_select_public on public.anamnesis_forms
  for select to anon
  using (public_token is not null and status = 'pending' and expires_at > now());
create policy forms_update_public on public.anamnesis_forms
  for update to anon
  using (public_token is not null and status = 'pending' and expires_at > now())
  with check (status in ('pending','signed'));

-- photos
create policy photos_select on public.photos
  for select to authenticated using (tenant_id = public.tenant_id());
create policy photos_insert on public.photos
  for insert to authenticated with check (tenant_id = public.tenant_id());
create policy photos_update on public.photos
  for update to authenticated using (tenant_id = public.tenant_id())
  with check (tenant_id = public.tenant_id());
create policy photos_delete on public.photos
  for delete to authenticated using (tenant_id = public.tenant_id());

-- storage
create policy storage_photos_select on storage.objects
  for select to authenticated
  using (bucket_id = 'photos' and (storage.foldername(name))[1] = public.tenant_id()::text);
create policy storage_photos_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'photos' and (storage.foldername(name))[1] = public.tenant_id()::text);
create policy storage_photos_update on storage.objects
  for update to authenticated
  using (bucket_id = 'photos' and (storage.foldername(name))[1] = public.tenant_id()::text);
create policy storage_photos_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'photos' and (storage.foldername(name))[1] = public.tenant_id()::text);

create policy storage_pdfs_select on storage.objects
  for select to authenticated
  using (bucket_id = 'anamnesis-pdfs' and (storage.foldername(name))[1] = public.tenant_id()::text);
create policy storage_pdfs_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'anamnesis-pdfs' and (storage.foldername(name))[1] = public.tenant_id()::text);
create policy storage_pdfs_update on storage.objects
  for update to authenticated
  using (bucket_id = 'anamnesis-pdfs' and (storage.foldername(name))[1] = public.tenant_id()::text);
create policy storage_pdfs_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'anamnesis-pdfs' and (storage.foldername(name))[1] = public.tenant_id()::text);

-- =====================================================================
-- FIM. Após rodar este, rode SQL_BOOKING_SYSTEM.sql.
-- =====================================================================
