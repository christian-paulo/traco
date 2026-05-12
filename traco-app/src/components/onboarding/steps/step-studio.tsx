'use client';

import { useEffect, useState, useTransition } from 'react';
import { toast } from 'sonner';

import { StepShell } from '@/components/onboarding/step-shell';
import { ImageUploadWithCrop } from '@/components/shared/image-upload-with-crop';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { advanceOnboardingStep } from '@/server/actions/onboarding';
import { updateStudio } from '@/server/actions/studio';
import { removeStudioCover, uploadStudioCover } from '@/server/actions/upload';

type Props = {
  initial: {
    name: string;
    slug: string;
    address: string;
    bio: string;
    cover_image_url: string;
  };
  designerFullName: string;
  publicBaseUrl: string;
};

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
}

export function StepStudio({ initial, designerFullName, publicBaseUrl }: Props) {
  const [name, setName] = useState(initial.name);
  const [slug, setSlug] = useState(initial.slug);
  const [address, setAddress] = useState(initial.address);
  const [bio, setBio] = useState(initial.bio);
  const [coverUrl, setCoverUrl] = useState<string | null>(initial.cover_image_url || null);
  const [slugTouched, setSlugTouched] = useState(Boolean(initial.slug));
  const [pending, startTransition] = useTransition();

  // Auto-sugere slug a partir do nome do studio (ou do designer) enquanto user não tocou
  useEffect(() => {
    if (slugTouched) return;
    const seed = name.trim() || designerFullName;
    if (seed) setSlug(slugify(seed));
  }, [name, designerFullName, slugTouched]);

  const isValid = name.trim().length >= 2 && slug.length >= 3;
  const publicUrl = `${publicBaseUrl}/agendar/${slug || '...'}`;

  function handleContinue() {
    if (!isValid) return;
    startTransition(async () => {
      const saved = await updateStudio({
        name,
        slug: slug.toLowerCase(),
        address: address || null,
        bio: bio || null,
        cover_image_url: coverUrl || null,
      });
      if (!saved.success) {
        toast.error(saved.error || 'Erro ao salvar.');
        return;
      }
      const advanced = await advanceOnboardingStep('studio');
      if (!advanced.success) toast.error(advanced.error || 'Erro ao avançar.');
    });
  }

  return (
    <StepShell
      step="studio"
      subtitle="Passo 2 de 5"
      title="Conte sobre seu studio"
      description="Esses dados aparecem na sua página pública de agendamento e nas mensagens enviadas pras clientes."
      onContinue={handleContinue}
      continueDisabled={!isValid}
      continuePending={pending}
    >
      <ImageUploadWithCrop
        value={coverUrl}
        onChange={setCoverUrl}
        uploadAction={uploadStudioCover}
        removeAction={removeStudioCover}
        aspect={16 / 9}
        cropShape="rect"
        outputWidth={1600}
        outputHeight={900}
        label="Foto de capa"
        helpText="Aparece no topo da página de agendamento. Use uma foto do seu espaço ou trabalho."
        previewClassName="h-32 w-full max-w-full sm:h-40"
      />

      <div className="flex flex-col gap-1.5">
        <Label className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Nome do studio *
        </Label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={pending}
          placeholder="Ex: Studio Alana Ferreira"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Slug do link público *
        </Label>
        <Input
          value={slug}
          onChange={(e) => {
            setSlugTouched(true);
            setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''));
          }}
          disabled={pending}
          placeholder="alana"
        />
        <p className="rounded-md bg-cream/40 px-3 py-2 text-xs text-muted-foreground ring-1 ring-cream-dark">
          Sua URL: <span className="font-medium text-foreground">{publicUrl}</span>
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Endereço
        </Label>
        <Input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          disabled={pending}
          placeholder="Rua, número, bairro, cidade"
        />
        <p className="text-[11px] text-muted-foreground">
          Vai pra variável <code className="rounded bg-cream/60 px-1">{'{endereco}'}</code> nas
          mensagens de lembrete.
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Bio
        </Label>
        <Textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={3}
          maxLength={280}
          disabled={pending}
          placeholder="Especialista em brow lamination com mais de 5 anos de experiência..."
        />
        <p className="text-[11px] text-muted-foreground">{bio.length}/280</p>
      </div>
    </StepShell>
  );
}
