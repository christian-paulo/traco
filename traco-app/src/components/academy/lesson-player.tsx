'use client';

import { CheckCircle2, Loader2 } from 'lucide-react';
import Script from 'next/script';
import { useCallback, useEffect, useRef, useState, useTransition } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { extractVimeoId } from '@/lib/validations/academy';
import {
  markLessonComplete,
  updateLessonProgress,
} from '@/server/actions/academy';

declare global {
  interface Window {
    Vimeo?: {
      Player: new (
        el: HTMLElement | string,
        opts?: {
          id?: number;
          url?: string;
          width?: number;
          responsive?: boolean;
          autoplay?: boolean;
        },
      ) => VimeoPlayerInstance;
    };
  }
}

type VimeoPlayerInstance = {
  on(
    event: 'timeupdate' | 'ended' | 'play' | 'pause' | 'loaded',
    cb: (data?: { seconds?: number; percent?: number; duration?: number }) => void,
  ): void;
  off(event: string): void;
  getCurrentTime(): Promise<number>;
  setCurrentTime(seconds: number): Promise<number>;
  getDuration(): Promise<number>;
  destroy(): Promise<void>;
};

type Props = {
  lessonId: string;
  videoUrl: string | null;
  initialPosition: number;
  initialCompleted: boolean;
};

const FLUSH_INTERVAL_SECONDS = 10;

export function LessonPlayer({
  lessonId,
  videoUrl,
  initialPosition,
  initialCompleted,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<VimeoPlayerInstance | null>(null);
  const lastFlushRef = useRef<number>(initialPosition);
  const [completed, setCompleted] = useState(initialCompleted);
  const [pending, startTransition] = useTransition();
  const [scriptReady, setScriptReady] = useState(false);
  const vimeoId = extractVimeoId(videoUrl);

  // Flush periódico — chama action de progresso
  const flushProgress = useCallback(
    async (currentSeconds: number) => {
      const delta = Math.max(0, Math.floor(currentSeconds - lastFlushRef.current));
      lastFlushRef.current = currentSeconds;
      const result = await updateLessonProgress({
        lesson_id: lessonId,
        watched_seconds: delta,
        last_position_seconds: Math.floor(currentSeconds),
      });
      if (!result.success) {
        // não quebra a experiência — só loga
        console.error('[lesson-player] update progress:', result.error);
      }
    },
    [lessonId],
  );

  useEffect(() => {
    if (!vimeoId || !scriptReady || !containerRef.current || !window.Vimeo) {
      return;
    }
    const player = new window.Vimeo.Player(containerRef.current, {
      id: Number(vimeoId),
      responsive: true,
    });
    playerRef.current = player;

    if (initialPosition > 0) {
      player.setCurrentTime(initialPosition).catch(() => {
        /* ignore */
      });
    }

    let lastTickAt = Date.now();
    player.on('timeupdate', (data) => {
      if (!data || typeof data.seconds !== 'number') return;
      const now = Date.now();
      if (now - lastTickAt < FLUSH_INTERVAL_SECONDS * 1000) return;
      lastTickAt = now;
      void flushProgress(data.seconds);
    });

    player.on('ended', () => {
      // Marca como completo automaticamente quando vídeo termina
      if (completed) return;
      startTransition(async () => {
        const r = await markLessonComplete(lessonId);
        if (r.success) {
          setCompleted(true);
          toast.success('Aula concluída! ✨');
        }
      });
    });

    return () => {
      player.destroy().catch(() => {
        /* ignore */
      });
      playerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vimeoId, scriptReady]);

  // Flush ao desmontar (cobre saída da página)
  useEffect(() => {
    const player = playerRef.current;
    return () => {
      if (!player) return;
      player
        .getCurrentTime()
        .then((seconds) => flushProgress(seconds))
        .catch(() => {
          /* ignore */
        });
    };
  }, [flushProgress]);

  function handleManualComplete() {
    startTransition(async () => {
      const r = await markLessonComplete(lessonId);
      if (r.success) {
        setCompleted(true);
        toast.success('Aula marcada como concluída.');
      } else {
        toast.error(r.error);
      }
    });
  }

  return (
    <div className="flex flex-col gap-3">
      {vimeoId ? (
        <>
          <Script
            src="https://player.vimeo.com/api/player.js"
            onReady={() => setScriptReady(true)}
            onLoad={() => setScriptReady(true)}
          />
          <div className="relative w-full overflow-hidden rounded-xl bg-black">
            <div
              ref={containerRef}
              style={{ paddingTop: '56.25%' /* 16:9 placeholder */ }}
              className="relative w-full"
            />
            {!scriptReady ? (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <Loader2 className="size-8 animate-spin text-cream/60" />
              </div>
            ) : null}
          </div>
        </>
      ) : videoUrl ? (
        <video
          src={videoUrl}
          controls
          className="aspect-video w-full rounded-xl bg-black"
          onTimeUpdate={(e) => {
            const v = e.currentTarget;
            const now = Date.now();
            const last = (e.currentTarget as unknown as { _lastFlush?: number })._lastFlush ?? 0;
            if (now - last < FLUSH_INTERVAL_SECONDS * 1000) return;
            (e.currentTarget as unknown as { _lastFlush?: number })._lastFlush = now;
            void flushProgress(v.currentTime);
          }}
          onEnded={handleManualComplete}
        />
      ) : (
        <div className="flex aspect-video w-full items-center justify-center rounded-xl bg-cream-dark text-sm text-muted-foreground">
          Vídeo ainda não disponível.
        </div>
      )}

      <div className="flex items-center justify-between gap-2">
        {completed ? (
          <span className="inline-flex items-center gap-2 text-sm font-medium text-emerald-700">
            <CheckCircle2 className="size-4" />
            Aula concluída
          </span>
        ) : (
          <span className="text-sm text-muted-foreground">
            O progresso é salvo automaticamente.
          </span>
        )}
        {!completed ? (
          <Button
            variant="premium"
            size="sm"
            onClick={handleManualComplete}
            disabled={pending}
          >
            {pending ? <Loader2 className="size-4 animate-spin" /> : null}
            Marcar como concluída
          </Button>
        ) : null}
      </div>
    </div>
  );
}
