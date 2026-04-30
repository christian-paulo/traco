'use client';

import { Loader2, Save, Trash2 } from 'lucide-react';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { formatDate, formatDateTimeShort } from '@/lib/format';
import { addTimeOff, removeTimeOff, replaceWorkingHours } from '@/server/actions/studio';

type WorkingHour = {
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
};

type TimeOff = {
  id: string;
  start_at: string;
  end_at: string;
  reason: string | null;
};

type Props = {
  initialHours: WorkingHour[];
  initialTimeOff: TimeOff[];
};

const DAYS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

function buildSeven(input: WorkingHour[]): WorkingHour[] {
  const map = new Map(input.map((h) => [h.day_of_week, h]));
  return Array.from({ length: 7 }, (_, day) =>
    map.get(day) ?? {
      day_of_week: day,
      start_time: '09:00',
      end_time: '18:00',
      is_active: false,
    },
  );
}

export function WorkingHoursSettings({ initialHours, initialTimeOff }: Props) {
  const [hours, setHours] = useState<WorkingHour[]>(() => buildSeven(initialHours));
  const [timeOff, setTimeOff] = useState<TimeOff[]>(initialTimeOff);
  const [savingHours, startSaveHours] = useTransition();
  const [addOpen, setAddOpen] = useState(false);

  function update(idx: number, patch: Partial<WorkingHour>) {
    setHours((prev) => prev.map((h, i) => (i === idx ? { ...h, ...patch } : h)));
  }

  function copyToWeekdays() {
    const monday = hours.find((h) => h.day_of_week === 1);
    if (!monday) return;
    setHours((prev) =>
      prev.map((h) =>
        h.day_of_week >= 1 && h.day_of_week <= 5
          ? { ...h, start_time: monday.start_time, end_time: monday.end_time, is_active: true }
          : h,
      ),
    );
    toast.success('Configuração de segunda copiada para os outros dias úteis.');
  }

  function handleSaveHours() {
    startSaveHours(async () => {
      const result = await replaceWorkingHours(
        hours.map((h) => ({
          day_of_week: h.day_of_week,
          start_time: h.start_time,
          end_time: h.end_time,
          is_active: h.is_active,
        })),
      );
      if (result.success) toast.success('Horários salvos.');
      else toast.error(result.error || 'Erro ao salvar.');
    });
  }

  function handleRemoveTimeOff(id: string) {
    void (async () => {
      const result = await removeTimeOff(id);
      if (result.success) {
        setTimeOff((prev) => prev.filter((t) => t.id !== id));
        toast.success('Folga removida.');
      } else {
        toast.error(result.error || 'Erro.');
      }
    })();
  }

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-col">
            <h3 className="font-serif text-lg font-medium text-foreground">Grade semanal</h3>
            <p className="text-xs text-muted-foreground">
              Defina os horários em que você atende em cada dia da semana.
            </p>
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={copyToWeekdays}>
            Aplicar segunda em todos os dias úteis
          </Button>
        </div>
        <div className="flex flex-col gap-2">
          {hours.map((h, idx) => (
            <div
              key={h.day_of_week}
              className="bg-card flex flex-col gap-3 rounded-lg border border-cream-dark p-3 sm:flex-row sm:items-center"
            >
              <div className="flex items-center gap-3 sm:w-44">
                <Switch
                  checked={h.is_active}
                  onCheckedChange={(checked) => update(idx, { is_active: Boolean(checked) })}
                />
                <span className="font-medium text-foreground">{DAYS[h.day_of_week]}</span>
              </div>
              {h.is_active ? (
                <div className="flex flex-1 items-center gap-2">
                  <Input
                    type="time"
                    value={h.start_time}
                    onChange={(e) => update(idx, { start_time: e.target.value })}
                    className="h-10 sm:w-32"
                  />
                  <span className="text-muted-foreground">até</span>
                  <Input
                    type="time"
                    value={h.end_time}
                    onChange={(e) => update(idx, { end_time: e.target.value })}
                    className="h-10 sm:w-32"
                  />
                </div>
              ) : (
                <span className="text-sm italic text-muted-foreground">Sem expediente</span>
              )}
            </div>
          ))}
        </div>
        <Button
          type="button"
          variant="default"
          onClick={handleSaveHours}
          disabled={savingHours}
          className="h-10 self-start"
        >
          {savingHours ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          Salvar grade
        </Button>
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-col">
            <h3 className="font-serif text-lg font-medium text-foreground">Folgas e bloqueios</h3>
            <p className="text-xs text-muted-foreground">
              Datas em que você não vai atender (viagens, feriados, etc).
            </p>
          </div>
          <Button type="button" variant="outline-gold" onClick={() => setAddOpen(true)}>
            + Adicionar folga
          </Button>
        </div>

        {timeOff.length === 0 ? (
          <p className="font-serif italic text-muted-foreground">Nenhuma folga cadastrada.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {timeOff.map((t) => (
              <li
                key={t.id}
                className="bg-card flex items-center justify-between gap-3 rounded-lg border border-cream-dark px-3 py-2"
              >
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium text-foreground">
                    {formatDate(t.start_at, 'short')} – {formatDate(t.end_at, 'short')}
                  </span>
                  {t.reason ? (
                    <span className="text-xs text-muted-foreground">{t.reason}</span>
                  ) : null}
                  <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                    Início: {formatDateTimeShort(t.start_at)}
                  </span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-destructive"
                  onClick={() => handleRemoveTimeOff(t.id)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <AddTimeOffDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onAdded={(entry) => setTimeOff((prev) => [...prev, entry])}
      />
    </div>
  );
}

function AddTimeOffDialog({
  open,
  onOpenChange,
  onAdded,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onAdded: (entry: TimeOff) => void;
}) {
  const [startAt, setStartAt] = useState('');
  const [endAt, setEndAt] = useState('');
  const [reason, setReason] = useState('');
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!startAt || !endAt) {
      toast.error('Informe início e fim.');
      return;
    }
    startTransition(async () => {
      const result = await addTimeOff({
        start_at: startAt,
        end_at: endAt,
        reason: reason || null,
      });
      if (result.success) {
        toast.success('Folga adicionada.');
        onAdded({
          id: `temp-${Date.now()}`,
          start_at: new Date(startAt).toISOString(),
          end_at: new Date(endAt).toISOString(),
          reason: reason || null,
        });
        setStartAt('');
        setEndAt('');
        setReason('');
        onOpenChange(false);
      } else {
        toast.error(result.error || 'Erro.');
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adicionar folga</DialogTitle>
          <DialogDescription>
            Bloqueia esses dias/horas no seu agendamento público e na agenda interna.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <DialogBody className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs uppercase tracking-[0.15em] text-muted-foreground">
                Início
              </Label>
              <Input
                type="datetime-local"
                value={startAt}
                onChange={(e) => setStartAt(e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs uppercase tracking-[0.15em] text-muted-foreground">
                Fim
              </Label>
              <Input
                type="datetime-local"
                value={endAt}
                onChange={(e) => setEndAt(e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs uppercase tracking-[0.15em] text-muted-foreground">
                Motivo (opcional)
              </Label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={2}
                placeholder="Viagem, feriado, etc"
              />
            </div>
          </DialogBody>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
              className="h-10"
            >
              Cancelar
            </Button>
            <Button type="submit" variant="default" disabled={isPending} className="h-10">
              {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              Adicionar folga
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
