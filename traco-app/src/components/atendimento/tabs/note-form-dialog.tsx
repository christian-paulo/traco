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
import { Textarea } from '@/components/ui/textarea';
import { createNote } from '@/server/actions/notes';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  appointmentId: string | null;
};

export function NoteFormDialog({ open, onOpenChange, clientId, appointmentId }: Props) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [pending, startTransition] = useTransition();

  function handleSubmit() {
    if (!title.trim()) {
      toast.error('Título obrigatório.');
      return;
    }
    if (!content.trim()) {
      toast.error('Conteúdo obrigatório.');
      return;
    }
    startTransition(async () => {
      const result = await createNote({
        client_id: clientId,
        appointment_id: appointmentId,
        title: title.trim(),
        content: content.trim(),
      });
      if (result.success) {
        toast.success('Nota criada.');
        setTitle('');
        setContent('');
        onOpenChange(false);
      } else {
        toast.error(result.error || 'Erro ao criar nota.');
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nova nota</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs uppercase tracking-[0.14em]">Título</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Sensibilidade na arcada esquerda"
                maxLength={120}
                disabled={pending}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs uppercase tracking-[0.14em]">Conteúdo</Label>
              <Textarea
                rows={5}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Detalhe a observação para futuras consultas…"
                maxLength={2000}
                disabled={pending}
              />
            </div>
          </div>
        </DialogBody>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={pending}>
            Cancelar
          </Button>
          <Button variant="premium" onClick={handleSubmit} disabled={pending}>
            {pending ? <Loader2 className="size-4 animate-spin" /> : null}
            Salvar nota
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
