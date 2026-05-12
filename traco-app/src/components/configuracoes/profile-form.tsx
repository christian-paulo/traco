'use client';

import { Loader2, Save } from 'lucide-react';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';

import { ImageUploadWithCrop } from '@/components/shared/image-upload-with-crop';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatPhoneBR } from '@/lib/utils/phone';
import {
  removeProfileAvatar,
  uploadProfileAvatar,
} from '@/server/actions/upload';
import { updateProfile } from '@/server/actions/settings';

type Props = {
  initial: {
    full_name: string;
    phone: string;
    avatar_url: string;
  };
};

export function ProfileForm({ initial }: Props) {
  const [fullName, setFullName] = useState(initial.full_name);
  const [phone, setPhone] = useState(initial.phone);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initial.avatar_url || null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await updateProfile({
        full_name: fullName,
        phone,
        avatar_url: avatarUrl ?? '',
      });
      if (result.success) toast.success('Perfil atualizado.');
      else toast.error(result.error || 'Erro ao salvar.');
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <ImageUploadWithCrop
        value={avatarUrl}
        onChange={setAvatarUrl}
        uploadAction={uploadProfileAvatar}
        removeAction={removeProfileAvatar}
        aspect={1}
        cropShape="round"
        outputWidth={500}
        outputHeight={500}
        label="Avatar"
        helpText="Aparece em emails, fichas e na sua agenda. Tamanho ideal: 500×500px (quadrada). JPG, PNG, WebP ou HEIC, máx 5MB."
      />

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Nome completo
          </Label>
          <Input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            disabled={isPending}
            placeholder="Seu nome"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
            WhatsApp Business
          </Label>
          <Input
            inputMode="tel"
            value={phone}
            onChange={(e) => setPhone(formatPhoneBR(e.target.value))}
            placeholder="(11) 99999-9999"
            disabled={isPending}
          />
        </div>
      </div>
      <div>
        <Button type="submit" variant="default" size="default" disabled={isPending} className="h-10">
          {isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          Salvar perfil
        </Button>
      </div>
    </form>
  );
}
