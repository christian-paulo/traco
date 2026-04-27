'use client';

import imageCompression from 'browser-image-compression';
import { ImagePlus, Loader2, Star, Upload, X } from 'lucide-react';
import { useRef, useState, useTransition } from 'react';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { ProcedureRow } from '@/lib/queries/procedures';
import { cn } from '@/lib/utils';
import { uploadPhoto } from '@/server/actions/photos';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  procedures: ProcedureRow[];
};

type FileItem = {
  id: string;
  file: File;
  previewUrl: string;
  procedureId: string;
  notes: string;
  isKey: boolean;
};

const ALLOWED = 'image/jpeg,image/png,image/webp';

function genId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function PhotoUploadDialog({ open, onOpenChange, clientId, procedures }: Props) {
  const [items, setItems] = useState<FileItem[]>([]);
  const [isPending, startTransition] = useTransition();
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function reset() {
    items.forEach((it) => URL.revokeObjectURL(it.previewUrl));
    setItems([]);
  }

  async function addFiles(fileList: FileList | File[]) {
    const arr = Array.from(fileList);
    const newItems: FileItem[] = [];
    for (const raw of arr) {
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(raw.type)) {
        toast.error(`${raw.name}: tipo não suportado.`);
        continue;
      }
      try {
        const compressed = await imageCompression(raw, {
          maxWidthOrHeight: 1600,
          maxSizeMB: 4,
          initialQuality: 0.85,
          useWebWorker: true,
        });
        newItems.push({
          id: genId(),
          file: compressed,
          previewUrl: URL.createObjectURL(compressed),
          procedureId: '',
          notes: '',
          isKey: false,
        });
      } catch {
        toast.error(`Falha ao processar ${raw.name}.`);
      }
    }
    setItems((prev) => [...prev, ...newItems]);
  }

  function removeItem(id: string) {
    setItems((prev) => {
      const target = prev.find((i) => i.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((i) => i.id !== id);
    });
  }

  function updateItem(id: string, patch: Partial<FileItem>) {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  }

  async function handleSubmit() {
    if (items.length === 0) {
      toast.error('Selecione pelo menos uma foto.');
      return;
    }

    startTransition(async () => {
      let success = 0;
      for (const item of items) {
        const fd = new FormData();
        fd.set('file', item.file);
        fd.set('clientId', clientId);
        if (item.procedureId) fd.set('procedureId', item.procedureId);
        if (item.notes) fd.set('notes', item.notes);
        fd.set('isKeyPhoto', item.isKey ? 'true' : 'false');
        const result = await uploadPhoto(fd);
        if (result.success) success += 1;
        else toast.error(result.error || 'Falha em uma foto.');
      }
      if (success > 0) {
        toast.success(`${success} ${success === 1 ? 'foto enviada' : 'fotos enviadas'}.`);
        reset();
        onOpenChange(false);
      }
    });
  }

  function handleClose() {
    if (isPending) return;
    reset();
    onOpenChange(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) handleClose();
        else onOpenChange(next);
      }}
    >
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Adicionar fotos</DialogTitle>
          <DialogDescription>
            Imagens são comprimidas automaticamente para até 1600px.
          </DialogDescription>
        </DialogHeader>

        <DialogBody>
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              if (e.dataTransfer.files.length > 0) {
                addFiles(e.dataTransfer.files);
              }
            }}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-8 text-center transition-colors',
              isDragging
                ? 'border-[var(--gold)] bg-[var(--gold)]/10'
                : 'border-[var(--gold)]/40 bg-cream/30 hover:border-[var(--gold)]/70 hover:bg-cream/50',
            )}
          >
            <ImagePlus className="size-8 text-[var(--gold)]" strokeWidth={1.5} />
            <p className="font-serif text-base text-foreground">
              Arraste fotos aqui ou clique para selecionar
            </p>
            <p className="text-xs text-muted-foreground">
              JPG, PNG, WebP — múltiplas suportadas
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept={ALLOWED}
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files) addFiles(e.target.files);
                e.target.value = '';
              }}
            />
          </div>

          {items.length > 0 ? (
            <div className="mt-5 flex flex-col gap-3">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                {items.length} {items.length === 1 ? 'foto' : 'fotos'} selecionada
                {items.length === 1 ? '' : 's'}
              </p>
              <ul className="flex flex-col gap-3">
                {items.map((item) => (
                  <li
                    key={item.id}
                    className="bg-card flex flex-col gap-3 rounded-lg border border-cream-dark p-3 sm:flex-row"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.previewUrl}
                      alt=""
                      className="size-20 shrink-0 rounded-md object-cover"
                    />
                    <div className="flex flex-1 flex-col gap-2">
                      <p className="truncate text-xs text-muted-foreground">
                        {item.file.name} · {(item.file.size / 1024).toFixed(0)}KB
                      </p>
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        <div className="flex flex-col gap-1">
                          <Label className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                            Procedimento
                          </Label>
                          <Select
                            value={item.procedureId}
                            onValueChange={(v) => updateItem(item.id, { procedureId: v ?? '' })}
                          >
                            <SelectTrigger className="h-9 w-full">
                              <SelectValue>
                                {(value: string | null) => {
                                  if (!value) return <span className="text-muted-foreground/70">Sem procedimento</span>;
                                  const proc = procedures.find((p) => p.id === value);
                                  return proc?.name ?? '—';
                                }}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              {procedures.map((p) => (
                                <SelectItem key={p.id} value={p.id}>
                                  {p.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex flex-col gap-1">
                          <Label className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                            Observação
                          </Label>
                          <Input
                            value={item.notes}
                            onChange={(e) => updateItem(item.id, { notes: e.target.value })}
                            placeholder="Curto e direto..."
                            className="h-9"
                          />
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => updateItem(item.id, { isKey: !item.isKey })}
                        className={cn(
                          'inline-flex items-center gap-1.5 self-start rounded-md border px-2.5 py-1 text-xs transition-colors',
                          item.isKey
                            ? 'border-[var(--gold)] bg-[var(--gold)]/10 text-[var(--gold)]'
                            : 'border-cream-dark text-muted-foreground hover:border-[var(--gold)]/40',
                        )}
                      >
                        <Star
                          className={cn('size-3.5', item.isKey && 'fill-[var(--gold)]')}
                        />
                        Foto-chave
                      </button>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeItem(item.id)}
                      className="size-8 shrink-0 self-start"
                      aria-label="Remover"
                    >
                      <X className="size-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </DialogBody>

        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={handleClose}
            disabled={isPending}
            className="h-10 sm:w-auto w-full"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="default"
            onClick={handleSubmit}
            disabled={isPending || items.length === 0}
            className="h-10 sm:w-auto w-full"
          >
            {isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Upload className="size-4" />
                Enviar {items.length > 0 ? items.length : ''} fotos
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
