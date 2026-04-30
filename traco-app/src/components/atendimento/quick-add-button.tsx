'use client';

import { AlertTriangle, Camera, Plus, StickyNote, X } from 'lucide-react';
import { useState } from 'react';

import { cn } from '@/lib/utils';

type Props = {
  onAddNote: () => void;
  onAddReaction: () => void;
  onAddPhoto: () => void;
};

export function QuickAddButton({ onAddNote, onAddReaction, onAddPhoto }: Props) {
  const [open, setOpen] = useState(false);

  function trigger(action: () => void) {
    setOpen(false);
    action();
  }

  return (
    <>
      {open ? (
        <button
          type="button"
          aria-label="Fechar menu"
          className="fixed inset-0 z-30 bg-black/20"
          onClick={() => setOpen(false)}
        />
      ) : null}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3">
        <div
          className={cn(
            'flex flex-col items-end gap-2 transition-all duration-200',
            open
              ? 'pointer-events-auto translate-y-0 opacity-100'
              : 'pointer-events-none translate-y-2 opacity-0',
          )}
        >
          <ActionItem
            icon={<StickyNote className="size-4" />}
            label="Nova nota"
            onClick={() => trigger(onAddNote)}
          />
          <ActionItem
            icon={<AlertTriangle className="size-4" />}
            label="Reação"
            onClick={() => trigger(onAddReaction)}
            tone="warning"
          />
          <ActionItem
            icon={<Camera className="size-4" />}
            label="Foto"
            onClick={() => trigger(onAddPhoto)}
          />
        </div>

        <button
          type="button"
          aria-label={open ? 'Fechar menu rápido' : 'Abrir menu rápido'}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className={cn(
            'inline-flex size-14 items-center justify-center rounded-full text-ink shadow-lg ring-2 ring-[var(--gold)]/40 transition-all',
            'bg-[var(--gold)] hover:bg-[var(--gold)]/90 hover:shadow-xl',
            open && 'rotate-45',
          )}
        >
          {open ? <X className="size-6" strokeWidth={2} /> : <Plus className="size-6" strokeWidth={2} />}
        </button>
      </div>
    </>
  );
}

function ActionItem({
  icon,
  label,
  onClick,
  tone = 'default',
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  tone?: 'default' | 'warning';
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-xs font-medium uppercase tracking-[0.14em] shadow-md transition-all hover:shadow-lg',
        tone === 'warning'
          ? 'bg-red-50 text-red-700 ring-1 ring-red-200 hover:bg-red-100'
          : 'bg-card text-foreground ring-1 ring-cream-dark hover:bg-cream',
      )}
    >
      {icon}
      {label}
    </button>
  );
}
