'use client';

import { Loader2, Save } from 'lucide-react';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { updateBookingPolicy } from '@/server/actions/studio';

type Props = {
  initial: {
    waitlist_enabled: boolean;
    booking_buffer_minutes: number;
  };
};

const BUFFER_OPTIONS = [0, 5, 10, 15, 30];

export function BookingPolicyForm({ initial }: Props) {
  const [waitlist, setWaitlist] = useState(initial.waitlist_enabled);
  const [buffer, setBuffer] = useState(initial.booking_buffer_minutes);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await updateBookingPolicy({
        waitlist_enabled: waitlist,
        booking_buffer_minutes: buffer,
      });
      if (result.success) toast.success('Política de agendamento salva.');
      else toast.error(result.error || 'Erro ao salvar.');
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="bg-card flex items-start gap-3 rounded-lg border border-cream-dark p-4">
        <Switch checked={waitlist} onCheckedChange={(v) => setWaitlist(Boolean(v))} className="mt-1" />
        <div className="flex flex-col gap-1">
          <Label className="text-sm font-medium text-foreground">Lista de espera</Label>
          <p className="text-xs text-muted-foreground">
            Cliente pode entrar em lista de espera quando a data preferida não tiver horário.
            Você decide quem chamar.
          </p>
        </div>
      </div>

      <div className="bg-card flex flex-col gap-3 rounded-lg border border-cream-dark p-4">
        <Label className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Intervalo entre atendimentos
        </Label>
        <p className="text-xs text-muted-foreground">
          Tempo de descanso/limpeza entre uma cliente e a próxima.
        </p>
        <Select value={String(buffer)} onValueChange={(v) => setBuffer(Number(v ?? 0))}>
          <SelectTrigger className="sm:w-56">
            <SelectValue>
              {(value: string | null) => (value ? `${value} min` : '—')}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {BUFFER_OPTIONS.map((opt) => (
              <SelectItem key={opt} value={String(opt)}>
                {opt === 0 ? 'Sem intervalo' : `${opt} minutos`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Button type="submit" variant="default" disabled={isPending} className="h-10">
          {isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          Salvar política
        </Button>
      </div>
    </form>
  );
}
