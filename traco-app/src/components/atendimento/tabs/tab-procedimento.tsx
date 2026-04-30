'use client';

import { Check, Loader2, Plus, Sparkles, Star, Timer, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type {
  AppointmentProcedureRow,
  FavoriteProductRow,
  ProductUsed,
  StepTime,
} from '@/lib/queries/appointment-procedures';
import { cn } from '@/lib/utils';
import {
  saveFavoriteProduct,
  upsertAppointmentProcedure,
} from '@/server/actions/appointment-procedures';

const AUTO_SAVE_DELAY_MS = 800;

type Props = {
  appointmentId: string;
  initial: AppointmentProcedureRow | null;
  favoriteProducts: FavoriteProductRow[];
};

type SaveState = 'idle' | 'pending' | 'saving' | 'saved' | 'error';

export function TabProcedimento({ appointmentId, initial, favoriteProducts }: Props) {
  const [products, setProducts] = useState<ProductUsed[]>(initial?.products_used ?? []);
  const [steps, setSteps] = useState<StepTime[]>(initial?.step_times ?? []);
  const [technique, setTechnique] = useState(initial?.technique ?? '');
  const [technicalNotes, setTechnicalNotes] = useState(initial?.technical_notes ?? '');
  const [saveState, setSaveState] = useState<SaveState>('idle');

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMounted = useRef(false);

  const persist = useCallback(
    async (data: {
      products: ProductUsed[];
      steps: StepTime[];
      technique: string;
      technicalNotes: string;
    }) => {
      setSaveState('saving');
      const result = await upsertAppointmentProcedure({
        appointment_id: appointmentId,
        products_used: data.products,
        step_times: data.steps,
        technique: data.technique || null,
        technical_notes: data.technicalNotes || null,
      });
      if (result.success) {
        setSaveState('saved');
      } else {
        setSaveState('error');
        toast.error(result.error || 'Erro ao salvar.');
      }
    },
    [appointmentId],
  );

  useEffect(() => {
    if (!isMounted.current) {
      isMounted.current = true;
      return;
    }
    setSaveState('pending');
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      void persist({ products, steps, technique, technicalNotes });
    }, AUTO_SAVE_DELAY_MS);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [products, steps, technique, technicalNotes, persist]);

  function addProduct(p?: Partial<ProductUsed>) {
    setProducts((prev) => [
      ...prev,
      { brand: '', product: '', lot: '', expiry: '', step_time: undefined, ...p },
    ]);
  }

  function updateProduct(idx: number, patch: Partial<ProductUsed>) {
    setProducts((prev) => prev.map((p, i) => (i === idx ? { ...p, ...patch } : p)));
  }

  function removeProduct(idx: number) {
    setProducts((prev) => prev.filter((_, i) => i !== idx));
  }

  function addFromFavorite(fav: FavoriteProductRow) {
    addProduct({
      brand: fav.brand,
      product: fav.product,
      category: fav.category ?? undefined,
      step_time: fav.default_step_time ?? undefined,
    });
  }

  async function handleSaveFavorite(idx: number) {
    const p = products[idx];
    if (!p?.brand || !p?.product) {
      toast.error('Marca e produto são obrigatórios.');
      return;
    }
    const result = await saveFavoriteProduct({
      brand: p.brand,
      product: p.product,
      default_step_time: p.step_time,
    });
    if (result.success) toast.success('Salvo nos favoritos.');
    else toast.error(result.error || 'Erro ao salvar favorito.');
  }

  function addStep() {
    setSteps((prev) => [...prev, { step_name: '', minutes: 0 }]);
  }

  function updateStep(idx: number, patch: Partial<StepTime>) {
    setSteps((prev) => prev.map((s, i) => (i === idx ? { ...s, ...patch } : s)));
  }

  function removeStep(idx: number) {
    setSteps((prev) => prev.filter((_, i) => i !== idx));
  }

  return (
    <div className="flex flex-col gap-4">
      <SaveIndicator state={saveState} />

      <Card variant="premium" className="bg-card border-0 ring-1 ring-[var(--border)]">
        <CardContent className="flex flex-col gap-4 px-6 py-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-[var(--gold)]" />
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                Produtos utilizados
              </p>
            </div>
            <Button variant="outline-gold" size="sm" onClick={() => addProduct()}>
              <Plus className="size-4" />
              Adicionar
            </Button>
          </div>

          {favoriteProducts.length > 0 ? (
            <div className="flex flex-col gap-1.5">
              <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                Favoritos
              </p>
              <div className="flex flex-wrap gap-2">
                {favoriteProducts.slice(0, 8).map((fav) => (
                  <button
                    key={fav.id}
                    type="button"
                    onClick={() => addFromFavorite(fav)}
                    className="inline-flex items-center gap-1.5 rounded-md border border-cream-dark bg-cream/40 px-2.5 py-1 text-xs hover:border-[var(--gold)]/60 hover:bg-[var(--gold)]/10"
                  >
                    <Star className="size-3 fill-[var(--gold)] text-[var(--gold)]" />
                    {fav.brand} · {fav.product}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {products.length === 0 ? (
            <p className="text-sm italic text-muted-foreground">
              Nenhum produto registrado ainda.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {products.map((p, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-1 gap-2 rounded-lg border border-cream-dark bg-cream/30 p-3 sm:grid-cols-[1fr_1fr_120px_120px_auto]"
                >
                  <div className="flex flex-col gap-1">
                    <Label className="text-[10px] uppercase tracking-[0.12em]">
                      Marca
                    </Label>
                    <Input
                      value={p.brand}
                      onChange={(e) => updateProduct(idx, { brand: e.target.value })}
                      placeholder="Ex: Henna Brow"
                      className="h-9"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label className="text-[10px] uppercase tracking-[0.12em]">
                      Produto
                    </Label>
                    <Input
                      value={p.product}
                      onChange={(e) => updateProduct(idx, { product: e.target.value })}
                      placeholder="Ex: Castanho médio"
                      className="h-9"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label className="text-[10px] uppercase tracking-[0.12em]">
                      Lote
                    </Label>
                    <Input
                      value={p.lot ?? ''}
                      onChange={(e) => updateProduct(idx, { lot: e.target.value })}
                      placeholder="—"
                      className="h-9"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label className="text-[10px] uppercase tracking-[0.12em]">
                      Validade
                    </Label>
                    <Input
                      value={p.expiry ?? ''}
                      onChange={(e) => updateProduct(idx, { expiry: e.target.value })}
                      placeholder="MM/AAAA"
                      className="h-9"
                    />
                  </div>
                  <div className="flex items-end gap-1.5">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-9"
                      onClick={() => handleSaveFavorite(idx)}
                      aria-label="Salvar como favorito"
                      title="Salvar como favorito"
                    >
                      <Star className="size-4 text-[var(--gold)]" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-9 text-destructive hover:bg-destructive/10"
                      onClick={() => removeProduct(idx)}
                      aria-label="Remover"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card variant="premium" className="bg-card border-0 ring-1 ring-[var(--border)]">
        <CardContent className="flex flex-col gap-4 px-6 py-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Timer className="size-4 text-[var(--gold)]" />
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                Tempos por etapa
              </p>
            </div>
            <Button variant="outline-gold" size="sm" onClick={addStep}>
              <Plus className="size-4" />
              Adicionar etapa
            </Button>
          </div>

          {steps.length === 0 ? (
            <p className="text-sm italic text-muted-foreground">
              Nenhuma etapa registrada ainda.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {steps.map((s, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-[1fr_100px_auto] gap-2 rounded-md border border-cream-dark bg-cream/30 p-2"
                >
                  <Input
                    value={s.step_name}
                    onChange={(e) => updateStep(idx, { step_name: e.target.value })}
                    placeholder="Ex: Henna - 1ª passagem"
                    className="h-9"
                  />
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      min={0}
                      max={180}
                      value={s.minutes}
                      onChange={(e) =>
                        updateStep(idx, { minutes: Number(e.target.value) || 0 })
                      }
                      className="h-9"
                    />
                    <span className="text-xs text-muted-foreground">min</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-9 text-destructive hover:bg-destructive/10"
                    onClick={() => removeStep(idx)}
                    aria-label="Remover"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card variant="premium" className="bg-card border-0 ring-1 ring-[var(--border)]">
        <CardContent className="flex flex-col gap-2 px-6 py-5">
          <Label className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
            Técnica utilizada
          </Label>
          <Textarea
            rows={3}
            value={technique}
            onChange={(e) => setTechnique(e.target.value)}
            placeholder="Ex: Lift + Henna passada na medida 1.5..."
            maxLength={2000}
          />
        </CardContent>
      </Card>

      <Card variant="premium" className="bg-card border-0 ring-1 ring-[var(--border)]">
        <CardContent className="flex flex-col gap-2 px-6 py-5">
          <Label className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
            Notas técnicas internas
          </Label>
          <Textarea
            rows={4}
            value={technicalNotes}
            onChange={(e) => setTechnicalNotes(e.target.value)}
            placeholder="Detalhes que só você precisa lembrar para o próximo atendimento..."
            maxLength={2000}
          />
          <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
            Não aparece para a cliente.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function SaveIndicator({ state }: { state: SaveState }) {
  if (state === 'idle') return null;
  const map: Record<Exclude<SaveState, 'idle'>, { icon: React.ReactNode; text: string; cls: string }> = {
    pending: {
      icon: <Loader2 className="size-3 animate-spin" />,
      text: 'Aguardando…',
      cls: 'bg-amber-50 text-amber-700 border-amber-200',
    },
    saving: {
      icon: <Loader2 className="size-3 animate-spin" />,
      text: 'Salvando…',
      cls: 'bg-amber-50 text-amber-700 border-amber-200',
    },
    saved: {
      icon: <Check className="size-3" />,
      text: 'Salvo automaticamente',
      cls: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    error: {
      icon: null,
      text: 'Erro ao salvar — tente novamente',
      cls: 'bg-red-50 text-red-700 border-red-200',
    },
  };
  const v = map[state];
  return (
    <div className="sticky top-[calc(57px+50px)] z-10 flex justify-end sm:top-[calc(60px+52px)]">
      <Badge
        variant="outline"
        className={cn('gap-1 px-2.5 py-1 text-[10px] uppercase tracking-[0.14em]', v.cls)}
      >
        {v.icon}
        {v.text}
      </Badge>
    </div>
  );
}
