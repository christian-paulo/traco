'use client';

import { Loader2, Save } from 'lucide-react';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { updateTenantSettings } from '@/server/actions/settings';

type Props = {
  initial: {
    name: string;
    whatsapp_template: string;
    accent_color: string;
  };
};

export function TenantSettingsForm({ initial }: Props) {
  const [name, setName] = useState(initial.name);
  const [whatsTemplate, setWhatsTemplate] = useState(initial.whatsapp_template);
  const [accent, setAccent] = useState(initial.accent_color);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await updateTenantSettings({
        name,
        whatsapp_template: whatsTemplate,
        accent_color: accent,
      });
      if (result.success) toast.success('Configurações salvas.');
      else toast.error(result.error || 'Erro ao salvar.');
    });
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
          placeholder="Master Brow Lamination"
          disabled={isPending}
        />
        <p className="text-xs text-muted-foreground">
          Aparece nos emails e PDFs como &quot;by [Nome]&quot;.
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Mensagem padrão de WhatsApp
        </Label>
        <Textarea
          value={whatsTemplate}
          onChange={(e) => setWhatsTemplate(e.target.value)}
          placeholder="Olá! Vi que faz {dias} dias do meu último {procedimento}. Gostaria de agendar meu retorno."
          rows={3}
          disabled={isPending}
        />
        <p className="text-xs text-muted-foreground">
          Variáveis disponíveis: <code className="font-mono">{'{dias}'}</code> e{' '}
          <code className="font-mono">{'{procedimento}'}</code>.
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Cor de destaque
        </Label>
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={accent}
            onChange={(e) => setAccent(e.target.value)}
            disabled={isPending}
            className="size-11 cursor-pointer rounded-md border border-input bg-transparent p-1"
            aria-label="Cor de destaque"
          />
          <Input
            value={accent}
            onChange={(e) => setAccent(e.target.value)}
            disabled={isPending}
            className="font-mono"
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Por enquanto só armazena — em breve aplica como tema personalizado.
        </p>
      </div>

      <div>
        <Button type="submit" variant="default" disabled={isPending} className="h-10">
          {isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          Salvar configurações
        </Button>
      </div>
    </form>
  );
}
