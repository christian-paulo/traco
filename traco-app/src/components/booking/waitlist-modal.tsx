'use client';

import { Loader2 } from 'lucide-react';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { digitsOnly, formatPhoneBR } from '@/lib/utils/phone';
import { createPublicWaitlistEntry } from '@/server/actions/booking';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  slug: string;
  procedureId: string;
  procedureName: string;
  defaultDate: string;
};

export function WaitlistModal({
  open,
  onOpenChange,
  slug,
  procedureId,
  procedureName,
  defaultDate,
}: Props) {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [date, setDate] = useState(defaultDate);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (fullName.trim().length < 3) {
      toast.error('Informe seu nome completo.');
      return;
    }
    if (digitsOnly(phone).length < 10) {
      toast.error('WhatsApp inválido.');
      return;
    }
    startTransition(async () => {
      const result = await createPublicWaitlistEntry({
        slug,
        procedure_id: procedureId,
        preferred_date: date,
        client_full_name: fullName.trim(),
        client_phone: phone,
        client_email: email.trim() || null,
      });
      if (result.success) {
        toast.success('Você está na lista! Vamos te avisar.');
        setFullName('');
        setPhone('');
        setEmail('');
        onOpenChange(false);
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Lista de espera</DialogTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            Te avisamos assim que abrir um horário pra <strong>{procedureName}</strong>.
          </p>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <DialogBody>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs uppercase tracking-[0.16em]">
                  Nome completo
                </Label>
                <Input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Como você quer ser chamada?"
                  disabled={pending}
                  required
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs uppercase tracking-[0.16em]">
                  Celular / WhatsApp
                </Label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(formatPhoneBR(e.target.value))}
                  placeholder="(11) 99999-9999"
                  inputMode="tel"
                  disabled={pending}
                  required
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs uppercase tracking-[0.16em]">
                  Email (opcional)
                </Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seuemail@exemplo.com"
                  inputMode="email"
                  disabled={pending}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs uppercase tracking-[0.16em]">
                  Data preferida
                </Label>
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  disabled={pending}
                  required
                />
              </div>
            </div>
          </DialogBody>
          <DialogFooter>
            <Button
              variant="ghost"
              type="button"
              onClick={() => onOpenChange(false)}
              disabled={pending}
            >
              Cancelar
            </Button>
            <Button variant="premium" type="submit" disabled={pending}>
              {pending ? <Loader2 className="size-4 animate-spin" /> : null}
              Entrar na lista
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
