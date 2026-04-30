'use client';

import { Loader2, Star, Trash2 } from 'lucide-react';
import { useEffect, useState, useTransition } from 'react';
import { toast } from 'sonner';

import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { Badge } from '@/components/ui/badge';
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
import { Textarea } from '@/components/ui/textarea';
import { formatDate, formatDateTimeShort } from '@/lib/format';
import type { PhotoWithUrl } from '@/lib/queries/photos';
import type { ProcedureRow } from '@/lib/queries/procedures';
import { cn } from '@/lib/utils';
import { deletePhoto, updatePhoto } from '@/server/actions/photos';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  photo: PhotoWithUrl | null;
  procedures: ProcedureRow[];
};

export function PhotoDetailDialog({ open, onOpenChange, photo, procedures }: Props) {
  const [notes, setNotes] = useState('');
  const [procedureId, setProcedureId] = useState<string>('');
  const [isKey, setIsKey] = useState(false);
  const [savePending, startSave] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (photo) {
      setNotes(photo.notes ?? '');
      setProcedureId(photo.procedure_id ?? '');
      setIsKey(photo.is_key_photo);
    }
  }, [photo]);

  if (!photo) return null;

  function handleSave() {
    if (!photo) return;
    startSave(async () => {
      const result = await updatePhoto(photo.id, {
        notes: notes || null,
        is_key_photo: isKey,
        procedure_id: procedureId || null,
      });
      if (result.success) toast.success('Foto atualizada.');
      else toast.error(result.error || 'Erro ao salvar.');
    });
  }

  async function performDelete() {
    if (!photo) return;
    const result = await deletePhoto(photo.id);
    if (result.success) {
      toast.success('Foto excluída.');
      onOpenChange(false);
    } else {
      throw new Error(result.error || 'Erro ao excluir.');
    }
  }

  const dirty =
    notes !== (photo.notes ?? '') ||
    procedureId !== (photo.procedure_id ?? '') ||
    isKey !== photo.is_key_photo;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Foto</DialogTitle>
          <DialogDescription>
            {formatDateTimeShort(photo.taken_at)}
          </DialogDescription>
        </DialogHeader>
        <DialogBody className="max-h-[80vh]">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-[1fr_280px]">
            <div className="bg-cream-dark/40 flex items-center justify-center overflow-hidden rounded-lg">
              {photo.signed_url ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={photo.signed_url}
                  alt=""
                  className="max-h-[60vh] w-full object-contain"
                />
              ) : (
                <p className="font-serif italic text-muted-foreground">
                  Imagem indisponível
                </p>
              )}
            </div>
            <aside className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  Data
                </p>
                <p className="font-serif text-base text-foreground">
                  {formatDate(photo.taken_at, 'long')}
                </p>
              </div>
              <div className="flex flex-col gap-1.5">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  Procedimento
                </p>
                <Select value={procedureId} onValueChange={(v) => setProcedureId(v ?? '')}>
                  <SelectTrigger className="w-full">
                    <SelectValue>
                      {(value: string | null) => {
                        if (!value) return <span className="text-muted-foreground/70">Nenhum</span>;
                        const proc = procedures.find((p) => p.id === value);
                        if (!proc) return <span className="text-muted-foreground/70">—</span>;
                        return (
                          <span className="flex items-center gap-2">
                            <span
                              className="size-2 rounded-full"
                              style={{ backgroundColor: proc.color }}
                            />
                            {proc.name}
                          </span>
                        );
                      }}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {procedures.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        <span className="flex items-center gap-2">
                          <span
                            className="size-2 rounded-full"
                            style={{ backgroundColor: p.color }}
                          />
                          {p.name}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  Observação
                </p>
                <Textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Anotação rápida..."
                />
              </div>
              <button
                type="button"
                onClick={() => setIsKey((v) => !v)}
                className={cn(
                  'inline-flex items-center gap-2 self-start rounded-md border px-3 py-1.5 text-xs transition-colors',
                  isKey
                    ? 'border-[var(--gold)] bg-[var(--gold)]/10 text-[var(--gold)]'
                    : 'border-cream-dark text-muted-foreground hover:border-[var(--gold)]/40',
                )}
              >
                <Star className={cn('size-3.5', isKey && 'fill-[var(--gold)]')} />
                {isKey ? 'Foto-chave' : 'Marcar como foto-chave'}
              </button>

              {photo.procedure ? (
                <div className="mt-2 flex flex-col gap-2">
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                    Atual
                  </p>
                  <Badge
                    variant="outline"
                    className="self-start border-transparent text-foreground"
                    style={{
                      backgroundColor: `${photo.procedure.color}1F`,
                      borderColor: `${photo.procedure.color}66`,
                    }}
                  >
                    <span
                      className="size-1.5 rounded-full"
                      style={{ backgroundColor: photo.procedure.color }}
                    />
                    {photo.procedure.name}
                  </Badge>
                </div>
              ) : null}

              <Button
                type="button"
                variant="ghost"
                onClick={() => setConfirmDelete(true)}
                className="text-destructive hover:bg-destructive/10 hover:text-destructive mt-auto self-start"
              >
                <Trash2 className="size-4" />
                Excluir foto
              </Button>
            </aside>
          </div>
        </DialogBody>
        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={savePending}
            className="h-10 sm:w-auto w-full"
          >
            Fechar
          </Button>
          <Button
            type="button"
            variant="default"
            onClick={handleSave}
            disabled={!dirty || savePending}
            className="h-10 sm:w-auto w-full"
          >
            {savePending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Salvando...
              </>
            ) : (
              'Salvar alterações'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Excluir foto?"
        description="A foto será removida permanentemente. Essa ação não pode ser desfeita."
        confirmLabel="Excluir"
        icon={Trash2}
        onConfirm={performDelete}
      />
    </Dialog>
  );
}
