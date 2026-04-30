'use client';

import { Check, Copy, Loader2, Save } from 'lucide-react';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { updateStudio } from '@/server/actions/studio';

type Props = {
  initial: {
    name: string;
    slug: string;
    address: string;
    bio: string;
    cover_image_url: string;
  };
  publicBaseUrl: string;
};

export function StudioSettingsForm({ initial, publicBaseUrl }: Props) {
  const [name, setName] = useState(initial.name);
  const [slug, setSlug] = useState(initial.slug);
  const [address, setAddress] = useState(initial.address);
  const [bio, setBio] = useState(initial.bio);
  const [coverUrl, setCoverUrl] = useState(initial.cover_image_url);
  const [isPending, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);

  const publicUrl = `${publicBaseUrl}/agendar/${slug || '...'}`;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await updateStudio({
        name,
        slug: slug.toLowerCase(),
        address: address || null,
        bio: bio || null,
        cover_image_url: coverUrl || null,
      });
      if (result.success) toast.success('Studio atualizado.');
      else toast.error(result.error || 'Erro ao salvar.');
    });
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      toast.success('Link copiado.');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Não foi possível copiar.');
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Nome do studio
        </Label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Studio Alana Ferreira"
          disabled={isPending}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Slug do link público
        </Label>
        <Input
          value={slug}
          onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
          placeholder="alana"
          disabled={isPending}
        />
        <div className="bg-cream/40 flex items-center gap-2 rounded-md border border-cream-dark px-3 py-2 text-xs">
          <span className="text-muted-foreground">Seu link:</span>
          <code className="flex-1 truncate font-mono text-foreground">{publicUrl}</code>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7"
            onClick={handleCopy}
            disabled={!slug}
          >
            {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
            {copied ? 'Copiado' : 'Copiar'}
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Endereço completo
        </Label>
        <Input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Rua, número, bairro, cidade"
          disabled={isPending}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Bio do studio
        </Label>
        <Textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Especialista em brow lamination..."
          rows={3}
          maxLength={280}
          disabled={isPending}
        />
        <p className="text-xs text-muted-foreground">{bio.length}/280</p>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Foto de capa (URL)
        </Label>
        <Input
          type="url"
          value={coverUrl}
          onChange={(e) => setCoverUrl(e.target.value)}
          placeholder="https://..."
          disabled={isPending}
        />
        <p className="text-xs text-muted-foreground">
          Cole a URL pública de uma imagem (em breve, upload direto).
        </p>
      </div>

      <div>
        <Button type="submit" variant="default" disabled={isPending} className="h-10">
          {isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          Salvar studio
        </Button>
      </div>
    </form>
  );
}
