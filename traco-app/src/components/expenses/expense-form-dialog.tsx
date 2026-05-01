'use client';

import { Loader2, Paperclip, Trash2, Upload, X } from 'lucide-react';
import { useEffect, useRef, useState, useTransition } from 'react';
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
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  EXPENSE_CATEGORIES,
  EXPENSE_CATEGORY_LABELS,
  RECURRENCE_TYPES,
  type ExpenseCategory,
  type RecurrenceType,
} from '@/lib/validations/expense';
import {
  createExpense,
  updateExpense,
  uploadReceipt,
} from '@/server/actions/expenses';

export type EditableExpense = {
  id: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  date: string;
  is_recurring: boolean;
  recurrence_pattern: { type?: string; day?: number } | null;
  receipt_url: string | null;
  notes: string | null;
  linked_product_id: string | null;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expense?: EditableExpense | null;
};

const RECURRENCE_LABELS: Record<RecurrenceType, string> = {
  weekly: 'Semanal',
  monthly: 'Mensal',
  yearly: 'Anual',
};

function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function ExpenseFormDialog({ open, onOpenChange, expense }: Props) {
  const isEdit = Boolean(expense);

  const [category, setCategory] = useState<ExpenseCategory>('other');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(todayIso());
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>('monthly');
  const [recurrenceDay, setRecurrenceDay] = useState('5');
  const [notes, setNotes] = useState('');
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [pending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    if (expense) {
      setCategory(expense.category);
      setDescription(expense.description);
      setAmount(expense.amount.toFixed(2));
      setDate(expense.date);
      setIsRecurring(expense.is_recurring);
      const rt = (expense.recurrence_pattern?.type ?? 'monthly') as RecurrenceType;
      setRecurrenceType(RECURRENCE_TYPES.includes(rt) ? rt : 'monthly');
      setRecurrenceDay(String(expense.recurrence_pattern?.day ?? 5));
      setNotes(expense.notes ?? '');
      setReceiptUrl(expense.receipt_url);
    } else {
      setCategory('other');
      setDescription('');
      setAmount('');
      setDate(todayIso());
      setIsRecurring(false);
      setRecurrenceType('monthly');
      setRecurrenceDay('5');
      setNotes('');
      setReceiptUrl(null);
    }
  }, [open, expense]);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const result = await uploadReceipt(fd);
      if (result.success) {
        setReceiptUrl(result.data.url);
        toast.success('Nota fiscal anexada.');
      } else {
        toast.error(result.error);
      }
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  function handleRemoveReceipt() {
    setReceiptUrl(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsedAmount = Number(amount.replace(',', '.'));
    if (!Number.isFinite(parsedAmount) || parsedAmount < 0) {
      toast.error('Valor inválido.');
      return;
    }
    if (description.trim().length < 2) {
      toast.error('Informe a descrição.');
      return;
    }

    const payload = {
      category,
      description: description.trim(),
      amount: parsedAmount,
      date,
      is_recurring: isRecurring,
      recurrence_pattern: isRecurring
        ? { type: recurrenceType, day: Number(recurrenceDay) || undefined }
        : null,
      receipt_url: receiptUrl,
      notes: notes.trim() || null,
      linked_product_id: null,
    };

    startTransition(async () => {
      const result = isEdit && expense
        ? await updateExpense(expense.id, payload)
        : await createExpense(payload);
      if (result.success) {
        toast.success(isEdit ? 'Despesa atualizada.' : 'Despesa registrada.');
        onOpenChange(false);
      } else {
        toast.error(result.error || 'Erro ao salvar.');
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar despesa' : 'Nova despesa'}</DialogTitle>
          <DialogDescription>
            Registre saídas pra acompanhar margem e gerar relatórios financeiros.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <DialogBody>
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs uppercase tracking-[0.16em]">Data</Label>
                  <Input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    disabled={pending}
                    required
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs uppercase tracking-[0.16em]">Categoria</Label>
                  <Select
                    value={category}
                    onValueChange={(v) => setCategory((v ?? 'other') as ExpenseCategory)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {EXPENSE_CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c}>
                          {EXPENSE_CATEGORY_LABELS[c]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="text-xs uppercase tracking-[0.16em]">Descrição</Label>
                <Input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ex: Lote de henna castanho médio"
                  maxLength={180}
                  disabled={pending}
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="text-xs uppercase tracking-[0.16em]">Valor (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0,00"
                  disabled={pending}
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5 rounded-md border border-cream-dark bg-cream/40 p-3">
                <label className="flex items-center gap-3">
                  <Switch
                    checked={isRecurring}
                    onCheckedChange={(v) => setIsRecurring(Boolean(v))}
                  />
                  <span className="text-sm font-medium text-foreground">
                    Despesa recorrente
                  </span>
                </label>
                {isRecurring ? (
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <div className="flex flex-col gap-1">
                      <Label className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                        Frequência
                      </Label>
                      <Select
                        value={recurrenceType}
                        onValueChange={(v) =>
                          setRecurrenceType((v ?? 'monthly') as RecurrenceType)
                        }
                      >
                        <SelectTrigger className="w-full" size="sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {RECURRENCE_TYPES.map((r) => (
                            <SelectItem key={r} value={r}>
                              {RECURRENCE_LABELS[r]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {recurrenceType !== 'weekly' ? (
                      <div className="flex flex-col gap-1">
                        <Label className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                          Dia (1-31)
                        </Label>
                        <Input
                          type="number"
                          min="1"
                          max="31"
                          value={recurrenceDay}
                          onChange={(e) => setRecurrenceDay(e.target.value)}
                          className="h-9"
                        />
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="text-xs uppercase tracking-[0.16em]">
                  Nota fiscal (opcional)
                </Label>
                {receiptUrl ? (
                  <div className="flex items-center gap-2 rounded-md border border-cream-dark bg-card px-3 py-2">
                    <Paperclip className="size-4 text-muted-foreground" />
                    <a
                      href={receiptUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 truncate text-xs text-[var(--gold)] underline-offset-2 hover:underline"
                    >
                      Visualizar anexo
                    </a>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={handleRemoveReceipt}
                      className="size-7"
                      aria-label="Remover anexo"
                    >
                      <X className="size-3.5" />
                    </Button>
                  </div>
                ) : (
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={handleFile}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline-gold"
                      size="default"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading || pending}
                    >
                      {uploading ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Upload className="size-4" />
                      )}
                      {uploading ? 'Enviando…' : 'Anexar nota fiscal'}
                    </Button>
                    <p className="mt-1 text-[10px] text-muted-foreground">
                      JPG, PNG, WebP ou PDF (até 5MB).
                    </p>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="text-xs uppercase tracking-[0.16em]">
                  Observações (opcional)
                </Label>
                <Textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Detalhes adicionais"
                  maxLength={500}
                  disabled={pending}
                />
              </div>
            </div>
          </DialogBody>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={pending || uploading}
            >
              Cancelar
            </Button>
            <Button type="submit" variant="premium" disabled={pending || uploading}>
              {pending ? <Loader2 className="size-4 animate-spin" /> : null}
              {isEdit ? 'Salvar alterações' : 'Registrar despesa'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export { Trash2 };
