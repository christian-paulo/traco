'use client';

import { Camera, GitCompareArrows, Plus, Star } from 'lucide-react';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { formatDate } from '@/lib/format';
import type { PhotoWithUrl } from '@/lib/queries/photos';
import type { ProcedureRow } from '@/lib/queries/procedures';
import { cn } from '@/lib/utils';

import { ComparePhotosDialog } from './compare-photos-dialog';
import { PhotoDetailDialog } from './photo-detail-dialog';
import { PhotoUploadDialog } from './photo-upload-dialog';

type Props = {
  clientId: string;
  photos: PhotoWithUrl[];
  procedures: ProcedureRow[];
};

export function PhotosSection({ clientId, photos, procedures }: Props) {
  const [uploadOpen, setUploadOpen] = useState(false);
  const [compareOpen, setCompareOpen] = useState(false);
  const [detailPhoto, setDetailPhoto] = useState<PhotoWithUrl | null>(null);
  const [keyOnly, setKeyOnly] = useState(false);

  const visible = keyOnly ? photos.filter((p) => p.is_key_photo) : photos;

  if (photos.length === 0) {
    return (
      <>
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            0 fotos
          </p>
          <Button variant="outline-gold" onClick={() => setUploadOpen(true)}>
            <Plus className="size-4" />
            Adicionar fotos
          </Button>
        </div>
        <Card variant="premium" className="bg-card border-0 ring-1 ring-[var(--border)] py-12">
          <CardContent className="flex flex-col items-center gap-4 text-center">
            <div className="flex size-16 items-center justify-center rounded-full bg-[var(--gold)]/10">
              <Camera className="size-8 text-[var(--gold)]" strokeWidth={1.25} />
            </div>
            <p className="font-serif text-lg italic text-muted-foreground">
              Nenhuma foto adicionada ainda.
            </p>
            <Button variant="premium" size="xl" onClick={() => setUploadOpen(true)}>
              <Plus className="size-4" />
              Adicionar primeira foto
            </Button>
          </CardContent>
        </Card>
        <PhotoUploadDialog
          open={uploadOpen}
          onOpenChange={setUploadOpen}
          clientId={clientId}
          procedures={procedures}
        />
      </>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            {photos.length} {photos.length === 1 ? 'foto' : 'fotos'}
          </p>
          <label className="flex items-center gap-2 text-xs">
            <Switch
              checked={keyOnly}
              onCheckedChange={(v) => setKeyOnly(Boolean(v))}
              aria-label="Filtrar fotos-chave"
            />
            <span className="uppercase tracking-[0.18em] text-muted-foreground">
              Apenas fotos-chave
            </span>
          </label>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="ghost"
            onClick={() => setCompareOpen(true)}
            disabled={photos.length < 2}
          >
            <GitCompareArrows className="size-4" />
            Comparar antes/depois
          </Button>
          <Button variant="outline-gold" onClick={() => setUploadOpen(true)}>
            <Plus className="size-4" />
            Adicionar fotos
          </Button>
        </div>
      </div>

      {visible.length === 0 ? (
        <Card variant="premium" className="bg-card border-0 ring-1 ring-[var(--border)] py-12">
          <CardContent className="text-center">
            <p className="font-serif text-base italic text-muted-foreground">
              Nenhuma foto-chave marcada ainda.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {visible.map((photo) => (
            <button
              key={photo.id}
              type="button"
              onClick={() => setDetailPhoto(photo)}
              className={cn(
                'group/photo relative aspect-square overflow-hidden rounded-lg border bg-cream/50 transition-all',
                'border-cream-dark hover:border-[var(--gold)]/60 hover:scale-[1.02]',
              )}
            >
              {photo.signed_url ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={photo.signed_url}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">
                  Indisponível
                </div>
              )}
              {photo.procedure ? (
                <div className="absolute left-2 top-2 z-10">
                  <Badge
                    variant="outline"
                    className="border-transparent text-foreground shadow-sm"
                    style={{
                      backgroundColor: `${photo.procedure.color}E6`,
                      color: '#0A0A0A',
                    }}
                  >
                    {photo.procedure.name}
                  </Badge>
                </div>
              ) : null}
              {photo.is_key_photo ? (
                <span className="bg-ink/80 absolute right-2 top-2 z-10 flex size-7 items-center justify-center rounded-full">
                  <Star className="size-3.5 fill-[var(--gold)] text-[var(--gold)]" />
                </span>
              ) : null}
              <span className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/70 to-transparent px-3 py-2 text-xs text-white">
                {formatDate(photo.taken_at, 'short')}
              </span>
            </button>
          ))}
        </div>
      )}

      <PhotoUploadDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        clientId={clientId}
        procedures={procedures}
      />
      <ComparePhotosDialog
        open={compareOpen}
        onOpenChange={setCompareOpen}
        photos={photos.filter((p) => p.signed_url)}
      />
      <PhotoDetailDialog
        open={detailPhoto !== null}
        onOpenChange={(open) => {
          if (!open) setDetailPhoto(null);
        }}
        photo={detailPhoto}
        procedures={procedures}
      />
    </div>
  );
}
