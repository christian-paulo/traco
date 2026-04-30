'use client';

import { ArrowLeft, Check, Maximize2, Minimize2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';

type Props = {
  clientName: string;
  procedureName: string;
  scheduledStart: string | null;
  elapsedSeconds: number;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  onFinalize: () => void;
};

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function formatTime(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

function formatHHMM(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function AtendimentoHeader({
  clientName,
  procedureName,
  scheduledStart,
  elapsedSeconds,
  isFullscreen,
  onToggleFullscreen,
  onFinalize,
}: Props) {
  const router = useRouter();
  return (
    <header className="bg-ink sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-[var(--gold)]/20 px-4 py-3 sm:px-6">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/dashboard/agenda')}
          className="text-cream hover:bg-white/10 hover:text-[var(--gold)]"
        >
          <ArrowLeft className="size-4" />
          <span className="hidden sm:inline">Agenda</span>
        </Button>
      </div>

      <div className="flex min-w-0 flex-1 flex-col items-center text-center">
        <h1 className="font-serif text-lg font-medium text-cream sm:text-xl">{clientName}</h1>
        <p className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.2em] text-[var(--gold)] sm:text-xs">
          <span>{procedureName}</span>
          <span>·</span>
          <span>{formatHHMM(scheduledStart)}</span>
          <span>·</span>
          <span className="inline-flex items-center gap-1">
            <span
              className="inline-block size-1.5 animate-pulse rounded-full bg-[var(--gold)]"
              aria-hidden
            />
            <span className="font-mono">{formatTime(elapsedSeconds)}</span>
          </span>
        </p>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleFullscreen}
          className="text-cream hidden hover:bg-white/10 sm:inline-flex"
          aria-label={isFullscreen ? 'Sair de tela cheia' : 'Tela cheia'}
        >
          {isFullscreen ? (
            <Minimize2 className="size-4" />
          ) : (
            <Maximize2 className="size-4" />
          )}
        </Button>
        <Button
          variant="premium"
          size="default"
          className="h-10 px-4"
          onClick={onFinalize}
        >
          <Check className="size-4" />
          <span className="hidden sm:inline">Finalizar</span>
        </Button>
      </div>
    </header>
  );
}
