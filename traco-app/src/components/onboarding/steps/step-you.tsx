'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';

import { StepShell } from '@/components/onboarding/step-shell';
import { ImageUploadWithCrop } from '@/components/shared/image-upload-with-crop';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatPhoneBR } from '@/lib/utils/phone';
import { advanceOnboardingStep } from '@/server/actions/onboarding';
import { updateProfile } from '@/server/actions/settings';
import { removeProfileAvatar, uploadProfileAvatar } from '@/server/actions/upload';

type Props = {
  initial: {
    full_name: string;
    phone: string;
    avatar_url: string;
  };
};

export function StepYou({ initial }: Props) {
  const [fullName, setFullName] = useState(initial.full_name);
  const [phone, setPhone] = useState(initial.phone);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initial.avatar_url || null);
  const [pending, startTransition] = useTransition();

  const isValid = fullName.trim().length >= 2 && phone.replace(/\D/g, '').length >= 10;

  function handleContinue() {
    if (!isValid) return;
    startTransition(async () => {
      const saved = await updateProfile({
        full_name: fullName,
        phone,
        avatar_url: avatarUrl ?? '',
      });
      if (!saved.success) {
        toast.error(saved.error || 'Erro ao salvar.');
        return;
      }
      const advanced = await advanceOnboardingStep('you');
      if (!advanced.success) {
        toast.error(advanced.error || 'Erro ao avançar.');
      }
    });
  }

  return (
    <StepShell
      step="you"
      subtitle="Passo 1 de 5"
      title="Vamos começar com você"
      description="Seu nome, WhatsApp e foto aparecem em emails, fichas e na sua agenda."
      onContinue={handleContinue}
      continueDisabled={!isValid}
      continuePending={pending}
    >
      <ImageUploadWithCrop
        value={avatarUrl}
        onChange={setAvatarUrl}
        uploadAction={uploadProfileAvatar}
        removeAction={removeProfileAvatar}
        aspect={1}
        cropShape="round"
        outputWidth={500}
        outputHeight={500}
        label="Sua foto"
        helpText="Opcional. Tamanho ideal: 500×500px (formato quadrado). Aparece nas suas mensagens e fichas."
      />

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Nome completo *
          </Label>
          <Input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            disabled={pending}
            placeholder="Como você gostaria de ser chamada"
            autoFocus
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
            WhatsApp Business *
          </Label>
          <Input
            inputMode="tel"
            value={phone}
            onChange={(e) => setPhone(formatPhoneBR(e.target.value))}
            disabled={pending}
            placeholder="(11) 99999-9999"
          />
        </div>
      </div>
    </StepShell>
  );
}
