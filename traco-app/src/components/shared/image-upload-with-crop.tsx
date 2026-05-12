'use client';

import imageCompression from 'browser-image-compression';
import { Camera, Loader2, Trash2, Upload } from 'lucide-react';
import Image from 'next/image';
import { useRef, useState } from 'react';
import { toast } from 'sonner';

import { ImageCropModal } from '@/components/shared/image-crop-modal';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type UploadResult = { success: true; url: string } | { success: false; error: string };

type Props = {
  value: string | null;
  onChange: (url: string | null) => void;
  uploadAction: (file: File) => Promise<UploadResult>;
  removeAction?: () => Promise<{ success: boolean; error?: string }>;
  aspect: number; // 1 for square avatar, 16/9 for cover
  cropShape: 'rect' | 'round';
  outputWidth: number;
  outputHeight: number;
  label?: string;
  helpText?: string;
  className?: string;
  previewClassName?: string;
};

async function convertHeicIfNeeded(file: File): Promise<File> {
  const isHeic =
    /\.heic$|\.heif$/i.test(file.name) ||
    file.type === 'image/heic' ||
    file.type === 'image/heif';
  if (!isHeic) return file;

  try {
    const heic2any = (await import('heic2any')).default;
    const result = await heic2any({
      blob: file,
      toType: 'image/jpeg',
      quality: 0.92,
    });
    const blob = Array.isArray(result) ? result[0] : result;
    if (!blob) throw new Error('Conversão de HEIC retornou vazia.');
    const name = file.name.replace(/\.(heic|heif)$/i, '.jpg');
    return new File([blob], name, { type: 'image/jpeg' });
  } catch (err) {
    throw new Error(
      err instanceof Error ? `Falha ao converter HEIC: ${err.message}` : 'Falha ao converter HEIC.',
    );
  }
}

export function ImageUploadWithCrop({
  value,
  onChange,
  uploadAction,
  removeAction,
  aspect,
  cropShape,
  outputWidth,
  outputHeight,
  label = 'Foto',
  helpText,
  className,
  previewClassName,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [cropOpen, setCropOpen] = useState(false);
  const [pickedImageSrc, setPickedImageSrc] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    // Reset pra permitir re-selecionar o mesmo arquivo
    e.target.value = '';

    if (!/^image\//.test(file.type) && !/\.(heic|heif)$/i.test(file.name)) {
      toast.error('Selecione uma imagem (JPG, PNG, WebP ou HEIC).');
      return;
    }

    try {
      const normalized = await convertHeicIfNeeded(file);
      const dataUrl = await fileToDataUrl(normalized);
      setPickedImageSrc(dataUrl);
      setCropOpen(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao ler imagem.');
    }
  }

  async function handleCropConfirm(blob: Blob) {
    setUploading(true);
    try {
      const original = new File([blob], 'crop.jpg', { type: 'image/jpeg' });
      const compressed = await imageCompression(original, {
        maxSizeMB: 0.5,
        maxWidthOrHeight: Math.max(outputWidth, outputHeight),
        useWebWorker: true,
        fileType: 'image/jpeg',
      });
      const result = await uploadAction(compressed);
      if (result.success) {
        onChange(`${result.url}?v=${Date.now()}`);
        toast.success('Foto atualizada.');
      } else {
        toast.error(result.error || 'Erro ao enviar foto.');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao processar imagem.');
    } finally {
      setUploading(false);
    }
  }

  async function handleRemove() {
    if (!removeAction) {
      onChange(null);
      return;
    }
    if (!confirm('Remover foto?')) return;
    setRemoving(true);
    try {
      const result = await removeAction();
      if (result.success) {
        onChange(null);
        toast.success('Foto removida.');
      } else {
        toast.error(result.error || 'Erro ao remover.');
      }
    } finally {
      setRemoving(false);
    }
  }

  const isRound = cropShape === 'round';

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {label ? (
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
          {label}
        </p>
      ) : null}

      <div className="flex items-start gap-4">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || removing}
          className={cn(
            'group relative shrink-0 overflow-hidden border-2 border-dashed border-cream-dark bg-cream/40 transition-all',
            'hover:border-[var(--gold)]/60 hover:bg-cream/60',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)]/40',
            'disabled:cursor-not-allowed disabled:opacity-50',
            isRound ? 'rounded-full' : 'rounded-lg',
            previewClassName ??
              (isRound ? 'size-24 sm:size-28' : 'h-32 w-full max-w-[280px] sm:h-36'),
          )}
          aria-label={value ? 'Trocar foto' : 'Adicionar foto'}
        >
          {value ? (
            <Image
              src={value}
              alt=""
              fill
              sizes="(max-width: 640px) 200px, 280px"
              className="object-cover"
            />
          ) : (
            <span className="flex h-full w-full flex-col items-center justify-center gap-1.5 text-muted-foreground">
              <Camera className="size-6" strokeWidth={1.5} />
              <span className="text-[11px] font-medium">Adicionar</span>
            </span>
          )}
          {uploading ? (
            <span className="absolute inset-0 flex items-center justify-center bg-foreground/60 text-background">
              <Loader2 className="size-5 animate-spin" />
            </span>
          ) : (
            <span
              className={cn(
                'absolute inset-0 flex items-center justify-center bg-foreground/0 text-background opacity-0 transition-all',
                'group-hover:bg-foreground/40 group-hover:opacity-100',
              )}
            >
              <Upload className="size-5" />
            </span>
          )}
        </button>

        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading || removing}
            >
              {value ? 'Trocar foto' : 'Adicionar foto'}
            </Button>
            {value ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleRemove}
                disabled={uploading || removing}
                className="text-red-600 hover:text-red-700"
              >
                {removing ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Trash2 className="size-3.5" />
                )}
                Remover
              </Button>
            ) : null}
          </div>
          {helpText ? (
            <p className="text-xs leading-relaxed text-muted-foreground">{helpText}</p>
          ) : (
            <p className="text-xs leading-relaxed text-muted-foreground">
              JPG, PNG, WebP ou HEIC (iPhone). Máx 5MB.
            </p>
          )}
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.heic,.heif"
        onChange={handleFileSelected}
        className="hidden"
      />

      <ImageCropModal
        open={cropOpen}
        onOpenChange={setCropOpen}
        imageSrc={pickedImageSrc}
        aspect={aspect}
        cropShape={cropShape}
        outputWidth={outputWidth}
        outputHeight={outputHeight}
        onCropConfirm={handleCropConfirm}
      />
    </div>
  );
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener('load', () => resolve(reader.result as string));
    reader.addEventListener('error', () => reject(new Error('Falha ao ler arquivo.')));
    reader.readAsDataURL(file);
  });
}
