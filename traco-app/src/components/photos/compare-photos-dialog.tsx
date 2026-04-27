'use client';

import { ArrowLeft } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  ReactCompareSlider,
  ReactCompareSliderImage,
} from 'react-compare-slider';

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
import { formatDate } from '@/lib/format';
import type { PhotoWithUrl } from '@/lib/queries/photos';
import { cn } from '@/lib/utils';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  photos: PhotoWithUrl[];
};

type Step = 'before' | 'after' | 'compare';

export function ComparePhotosDialog({ open, onOpenChange, photos }: Props) {
  const [step, setStep] = useState<Step>('before');
  const [beforeId, setBeforeId] = useState<string | null>(null);
  const [afterId, setAfterId] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setStep('before');
      setBeforeId(null);
      setAfterId(null);
    }
  }, [open]);

  const before = photos.find((p) => p.id === beforeId) ?? null;
  const after = photos.find((p) => p.id === afterId) ?? null;

  function PhotoGrid({
    excludeId,
    onPick,
  }: {
    excludeId: string | null;
    onPick: (id: string) => void;
  }) {
    return (
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
        {photos
          .filter((p) => p.id !== excludeId && p.signed_url)
          .map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => onPick(p.id)}
              className="group/photo relative aspect-square overflow-hidden rounded-md border border-cream-dark transition-colors hover:border-[var(--gold)]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.signed_url ?? ''}
                alt=""
                className="h-full w-full object-cover"
              />
              <span className="absolute bottom-1 left-1 rounded bg-black/70 px-1.5 py-0.5 text-[10px] text-white">
                {formatDate(p.taken_at, 'short')}
              </span>
            </button>
          ))}
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Comparar evolução</DialogTitle>
          <DialogDescription>
            {step === 'before'
              ? 'Selecione a foto "Antes"'
              : step === 'after'
                ? 'Selecione a foto "Depois"'
                : 'Arraste o controle para comparar'}
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          {step === 'before' ? (
            <PhotoGrid
              excludeId={null}
              onPick={(id) => {
                setBeforeId(id);
                setStep('after');
              }}
            />
          ) : null}
          {step === 'after' ? (
            <div className="flex flex-col gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStep('before')}
                className="self-start"
              >
                <ArrowLeft className="size-4" />
                Voltar
              </Button>
              <PhotoGrid
                excludeId={beforeId}
                onPick={(id) => {
                  setAfterId(id);
                  setStep('compare');
                }}
              />
            </div>
          ) : null}
          {step === 'compare' && before && after ? (
            <div className="flex flex-col gap-4">
              <div className="overflow-hidden rounded-xl border border-cream-dark bg-black">
                <ReactCompareSlider
                  itemOne={
                    <ReactCompareSliderImage
                      src={before.signed_url ?? ''}
                      alt="Antes"
                      style={{ objectFit: 'contain' }}
                    />
                  }
                  itemTwo={
                    <ReactCompareSliderImage
                      src={after.signed_url ?? ''}
                      alt="Depois"
                      style={{ objectFit: 'contain' }}
                    />
                  }
                  style={{ height: '60vh' }}
                />
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <PhotoMeta label="Antes" photo={before} />
                <PhotoMeta label="Depois" photo={after} alignEnd />
              </div>
              <Button
                type="button"
                variant="outline-gold"
                onClick={() => setStep('before')}
                className="self-start"
              >
                <ArrowLeft className="size-4" />
                Comparar outras fotos
              </Button>
            </div>
          ) : null}
        </DialogBody>
        <DialogFooter>
          <Button
            type="button"
            variant="default"
            onClick={() => onOpenChange(false)}
            className="h-10 sm:w-auto w-full"
          >
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PhotoMeta({
  label,
  photo,
  alignEnd,
}: {
  label: string;
  photo: PhotoWithUrl;
  alignEnd?: boolean;
}) {
  return (
    <div className={cn('flex flex-col gap-0.5', alignEnd && 'items-end text-right')}>
      <span className="font-medium uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </span>
      <span className="text-foreground">{formatDate(photo.taken_at, 'long')}</span>
      {photo.procedure ? (
        <span className="text-muted-foreground">{photo.procedure.name}</span>
      ) : null}
    </div>
  );
}
