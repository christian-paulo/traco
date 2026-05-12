'use client';

import { Loader2, Minus, Plus, RotateCw } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import CropperBase, { type Area } from 'react-easy-crop';

type CropperProps = {
  image: string;
  crop: { x: number; y: number };
  zoom: number;
  rotation?: number;
  aspect: number;
  cropShape?: 'rect' | 'round';
  showGrid?: boolean;
  onCropChange: (location: { x: number; y: number }) => void;
  onZoomChange: (zoom: number) => void;
  onCropComplete: (croppedArea: Area, croppedAreaPixels: Area) => void;
  classes?: { containerClassName?: string };
};

// react-easy-crop has type drift with React 19 — cast to bypass without runtime impact
const Cropper = CropperBase as unknown as React.ComponentType<CropperProps>;
import { toast } from 'sonner';

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

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageSrc: string | null;
  aspect: number;
  cropShape: 'rect' | 'round';
  outputWidth: number;
  outputHeight: number;
  onCropConfirm: (blob: Blob) => Promise<void> | void;
};

async function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.addEventListener('load', () => resolve(img));
    img.addEventListener('error', () => reject(new Error('Falha ao carregar imagem')));
    img.src = src;
  });
}

async function cropImageToBlob(
  imageSrc: string,
  cropArea: Area,
  outputWidth: number,
  outputHeight: number,
  rotation: number,
): Promise<Blob> {
  const image = await loadImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas indisponível');

  canvas.width = outputWidth;
  canvas.height = outputHeight;

  // Aplica rotação ao redor do centro
  if (rotation !== 0) {
    ctx.save();
    ctx.translate(outputWidth / 2, outputHeight / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.translate(-outputWidth / 2, -outputHeight / 2);
  }

  ctx.drawImage(
    image,
    cropArea.x,
    cropArea.y,
    cropArea.width,
    cropArea.height,
    0,
    0,
    outputWidth,
    outputHeight,
  );

  if (rotation !== 0) ctx.restore();

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) reject(new Error('Não foi possível gerar a imagem.'));
        else resolve(blob);
      },
      'image/jpeg',
      0.92,
    );
  });
}

export function ImageCropModal({
  open,
  onOpenChange,
  imageSrc,
  aspect,
  cropShape,
  outputWidth,
  outputHeight,
  onCropConfirm,
}: Props) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setRotation(0);
      setCroppedAreaPixels(null);
    }
  }, [open, imageSrc]);

  const handleCropComplete = useCallback((_: Area, areaPixels: Area) => {
    setCroppedAreaPixels(areaPixels);
  }, []);

  async function handleConfirm() {
    if (!imageSrc || !croppedAreaPixels) return;
    setSaving(true);
    try {
      const blob = await cropImageToBlob(
        imageSrc,
        croppedAreaPixels,
        outputWidth,
        outputHeight,
        rotation,
      );
      await onCropConfirm(blob);
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao processar imagem.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Ajuste a foto</DialogTitle>
          <DialogDescription>
            Arraste pra reposicionar e use o zoom pra enquadrar melhor.
          </DialogDescription>
        </DialogHeader>
        <DialogBody className="px-0">
          <div
            className="relative w-full overflow-hidden bg-foreground"
            style={{ height: 'min(60vh, 480px)' }}
          >
            {imageSrc ? (
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                rotation={rotation}
                aspect={aspect}
                cropShape={cropShape}
                showGrid={cropShape === 'rect'}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={handleCropComplete}
                classes={{
                  containerClassName: 'rounded-none',
                }}
              />
            ) : null}
          </div>

          <div className="flex flex-col gap-3 px-6 pt-5">
            <div className="flex items-center gap-3">
              <Minus className="size-4 shrink-0 text-muted-foreground" />
              <input
                type="range"
                min={1}
                max={3}
                step={0.05}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="flex-1 accent-[var(--gold)]"
                aria-label="Zoom"
              />
              <Plus className="size-4 shrink-0 text-muted-foreground" />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setRotation((r) => (r + 90) % 360)}
                aria-label="Girar 90°"
              >
                <RotateCw className="size-4" />
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Resultado final: {outputWidth}×{outputHeight}px
            </p>
          </div>
        </DialogBody>
        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="premium"
            onClick={handleConfirm}
            disabled={!croppedAreaPixels || saving}
          >
            {saving ? <Loader2 className="size-4 animate-spin" /> : null}
            Salvar foto
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
