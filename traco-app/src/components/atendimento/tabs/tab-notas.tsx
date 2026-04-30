'use client';

import { Pin, PinOff, Plus, StickyNote, Trash2 } from 'lucide-react';
import { useMemo, useState, useTransition } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { formatDate } from '@/lib/format';
import type { NoteRow } from '@/lib/queries/professional-notes';
import { cn } from '@/lib/utils';
import { deleteNote, toggleNotePin } from '@/server/actions/notes';

import { NoteFormDialog } from './note-form-dialog';

type Props = {
  clientId: string;
  appointmentId: string;
  notes: NoteRow[];
};

const ROTATIONS = ['-rotate-1', 'rotate-0', 'rotate-1', '-rotate-2', 'rotate-2'];

function rotationFor(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i += 1) h = (h + id.charCodeAt(i)) % ROTATIONS.length;
  return ROTATIONS[h] ?? 'rotate-0';
}

export function TabNotas({ clientId, appointmentId, notes }: Props) {
  const [open, setOpen] = useState(false);

  const sorted = useMemo(
    () =>
      [...notes].sort((a, b) => {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }),
    [notes],
  );

  if (sorted.length === 0) {
    return (
      <>
        <Card variant="premium" className="bg-card border-0 ring-1 ring-[var(--border)] py-12">
          <CardContent className="flex flex-col items-center gap-4 text-center">
            <div className="flex size-16 items-center justify-center rounded-full bg-[var(--gold)]/10">
              <StickyNote className="size-8 text-[var(--gold)]" strokeWidth={1.25} />
            </div>
            <p className="font-serif text-lg italic text-muted-foreground">
              Nenhuma nota ainda.
            </p>
            <Button variant="premium" size="xl" onClick={() => setOpen(true)}>
              <Plus className="size-4" />
              Adicionar nota
            </Button>
          </CardContent>
        </Card>
        <NoteFormDialog
          open={open}
          onOpenChange={setOpen}
          clientId={clientId}
          appointmentId={appointmentId}
        />
      </>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
          {sorted.length} {sorted.length === 1 ? 'nota' : 'notas'}
        </p>
        <Button variant="outline-gold" size="sm" onClick={() => setOpen(true)}>
          <Plus className="size-4" />
          Nova nota
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sorted.map((n) => (
          <NoteCard key={n.id} note={n} />
        ))}
      </div>

      <NoteFormDialog
        open={open}
        onOpenChange={setOpen}
        clientId={clientId}
        appointmentId={appointmentId}
      />
    </div>
  );
}

function NoteCard({ note }: { note: NoteRow }) {
  const [pending, startTransition] = useTransition();
  const rotation = rotationFor(note.id);

  function handleTogglePin() {
    startTransition(async () => {
      const result = await toggleNotePin(note.id);
      if (result.success) toast.success(note.pinned ? 'Nota desafixada.' : 'Nota fixada.');
      else toast.error(result.error || 'Erro ao alterar.');
    });
  }

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteNote(note.id);
      if (result.success) toast.success('Nota excluída.');
      else toast.error(result.error || 'Erro ao excluir.');
    });
  }

  return (
    <div
      className={cn(
        'group/note flex flex-col gap-2 rounded-md p-4 shadow-md transition-all hover:rotate-0 hover:shadow-xl',
        note.pinned
          ? 'bg-[var(--gold)]/20 ring-1 ring-[var(--gold)]/50'
          : 'bg-amber-50 ring-1 ring-amber-200/60',
        rotation,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="font-serif text-base font-medium leading-tight text-foreground">
          {note.title}
        </p>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={handleTogglePin}
            disabled={pending}
            className={cn(
              'inline-flex size-7 items-center justify-center rounded text-foreground/60 hover:bg-black/5 hover:text-foreground',
              note.pinned && 'text-[var(--gold)]',
            )}
            aria-label={note.pinned ? 'Desafixar' : 'Fixar'}
          >
            {note.pinned ? <Pin className="size-3.5" /> : <PinOff className="size-3.5" />}
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={pending}
            className="inline-flex size-7 items-center justify-center rounded text-foreground/60 hover:bg-destructive/10 hover:text-destructive"
            aria-label="Excluir nota"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      </div>
      <p className="whitespace-pre-wrap text-sm text-foreground/85">{note.content}</p>
      <p className="mt-auto text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
        {formatDate(note.created_at, 'short')}
      </p>
    </div>
  );
}
