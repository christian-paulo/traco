-- =====================================================================
-- Traço — migração 13: onboarding state + bucket de imagens de perfil
-- =====================================================================

-- Estado do wizard de onboarding no profile
alter table public.profiles
  add column if not exists onboarding_completed_at timestamptz,
  add column if not exists onboarding_step text not null default 'you';

create index if not exists profiles_onboarding_completed_at
  on public.profiles(onboarding_completed_at)
  where onboarding_completed_at is null;

-- Bucket público pra fotos de perfil + capa do studio
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'profile-images',
  'profile-images',
  true,
  5242880, -- 5MB
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Policies: leitura pública, escrita só pelo dono ou pelo tenant
drop policy if exists profile_images_public_read on storage.objects;
create policy profile_images_public_read on storage.objects
  for select using (bucket_id = 'profile-images');

drop policy if exists profile_images_owner_write on storage.objects;
create policy profile_images_owner_write on storage.objects
  for insert with check (
    bucket_id = 'profile-images'
    and (
      -- /<user_id>/avatar.* — só o próprio user
      (split_part(name, '/', 1)::uuid = auth.uid())
      -- /<tenant_id>/cover.* — qualquer profile do tenant
      or exists (
        select 1 from public.profiles p
        where p.tenant_id::text = split_part(name, '/', 1)
          and p.id = auth.uid()
      )
    )
  );

drop policy if exists profile_images_owner_update on storage.objects;
create policy profile_images_owner_update on storage.objects
  for update using (
    bucket_id = 'profile-images'
    and (
      (split_part(name, '/', 1)::uuid = auth.uid())
      or exists (
        select 1 from public.profiles p
        where p.tenant_id::text = split_part(name, '/', 1)
          and p.id = auth.uid()
      )
    )
  );

drop policy if exists profile_images_owner_delete on storage.objects;
create policy profile_images_owner_delete on storage.objects
  for delete using (
    bucket_id = 'profile-images'
    and (
      (split_part(name, '/', 1)::uuid = auth.uid())
      or exists (
        select 1 from public.profiles p
        where p.tenant_id::text = split_part(name, '/', 1)
          and p.id = auth.uid()
      )
    )
  );

-- Designers existentes (Alana inclusa) também passam pelo onboarding —
-- mas se já tiverem dados essenciais, deixam o step inicial pulado.
-- Marcamos onde provavelmente fazem sentido começar.
update public.profiles
set onboarding_step = case
  when full_name is null or full_name = '' then 'you'
  when phone is null or phone = '' then 'you'
  else 'studio'
end
where onboarding_completed_at is null;
