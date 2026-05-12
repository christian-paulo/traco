'use client';

import { Loader2 } from 'lucide-react';
import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import type { MessageTemplateRow } from '@/lib/queries/message-templates';
import { cn } from '@/lib/utils';
import {
  MESSAGE_TEMPLATE_CATEGORIES,
  MESSAGE_TEMPLATE_CATEGORY_LABELS,
  MESSAGE_TEMPLATE_VARIABLES,
  type MessageTemplateCategory,
} from '@/lib/validations/message-template';
import { renderTemplate } from '@/lib/whatsapp';
import {
  createMessageTemplate,
  updateMessageTemplate,
} from '@/server/actions/message-templates';

const PREVIEW_VARS = {
  cliente: 'Maria',
  procedimento: 'Brow Lamination',
  data: 'sexta, 02 de maio',
  hora: '14:00',
  valor: 'R$ 210,00',
  dias: '63',
  designer: 'Alana',
  studio: 'Studio Traço',
  endereco: 'Rua das Flores, 123 — Centro',
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: MessageTemplateRow | null;
  defaultCategory: MessageTemplateCategory;
};

export function MessageTemplateEditorDialog({
  open,
  onOpenChange,
  editing,
  defaultCategory,
}: Props) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<MessageTemplateCategory>('reminder');
  const [body, setBody] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [pending, startTransition] = useTransition();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setName(editing.name);
      setCategory(editing.category);
      setBody(editing.body);
      setIsDefault(editing.is_default);
    } else {
      setName('');
      setCategory(defaultCategory);
      setBody('');
      setIsDefault(false);
    }
  }, [open, editing, defaultCategory]);

  function insertVariable(key: string) {
    const ta = textareaRef.current;
    if (!ta) {
      setBody((prev) => `${prev}{${key}}`);
      return;
    }
    const start = ta.selectionStart ?? body.length;
    const end = ta.selectionEnd ?? body.length;
    const next = `${body.slice(0, start)}{${key}}${body.slice(end)}`;
    setBody(next);
    requestAnimationFrame(() => {
      ta.focus();
      const cursor = start + key.length + 2;
      ta.setSelectionRange(cursor, cursor);
    });
  }

  const preview = useMemo(() => renderTemplate(body, PREVIEW_VARS), [body]);
  const isValid = name.trim().length >= 2 && body.trim().length >= 5;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) return;
    startTransition(async () => {
      const payload = {
        name: name.trim(),
        category,
        body: body.trim(),
        is_default: isDefault,
      };
      const result = editing
        ? await updateMessageTemplate(editing.id, payload)
        : await createMessageTemplate(payload);
      if (result.success) {
        toast.success(editing ? 'Template atualizado.' : 'Template criado.');
        onOpenChange(false);
      } else {
        toast.error(result.error || 'Erro ao salvar.');
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{editing ? 'Editar template' : 'Novo template'}</DialogTitle>
          <DialogDescription>
            Use variáveis entre chaves pra personalizar a mensagem por cliente.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <DialogBody>
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                    Nome
                  </Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Lembrete D-1"
                    maxLength={80}
                    disabled={pending}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                    Categoria
                  </Label>
                  <Select
                    value={category}
                    onValueChange={(v) => setCategory(v as MessageTemplateCategory)}
                    disabled={pending}
                  >
                    <SelectTrigger className="h-11 w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MESSAGE_TEMPLATE_CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {MESSAGE_TEMPLATE_CATEGORY_LABELS[cat]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  disabled={pending}
                  className="size-4 rounded border-cream-dark accent-[var(--gold)]"
                />
                <span>Definir como padrão desta categoria</span>
              </label>

              <div className="flex flex-col gap-1.5">
                <Label className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                  Mensagem
                </Label>
                <Textarea
                  ref={textareaRef}
                  rows={5}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Oi {cliente}! Tudo bem? Confirmando seu {procedimento}..."
                  maxLength={1500}
                  disabled={pending}
                />
                <p className="text-[11px] text-muted-foreground">
                  {body.length}/1500 caracteres
                </p>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                  Inserir variável
                </Label>
                <div className="flex flex-wrap gap-1.5">
                  {MESSAGE_TEMPLATE_VARIABLES.map((v) => (
                    <button
                      key={v.key}
                      type="button"
                      onClick={() => insertVariable(v.key)}
                      disabled={pending}
                      className={cn(
                        'rounded-full border border-cream-dark bg-card px-2.5 py-1 text-xs font-medium text-foreground transition-colors',
                        'hover:border-[var(--gold)]/40 hover:bg-cream/60',
                        'disabled:cursor-not-allowed disabled:opacity-50',
                      )}
                    >
                      {v.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                  Preview (com Maria e Brow Lamination)
                </Label>
                <div className="whitespace-pre-line rounded-lg border border-cream-dark/60 bg-cream/40 px-4 py-3 text-sm leading-relaxed text-foreground">
                  {preview || (
                    <span className="italic text-muted-foreground/60">
                      Sua mensagem renderizada aparece aqui.
                    </span>
                  )}
                </div>
              </div>
            </div>
          </DialogBody>
          <DialogFooter>
            <Button
              variant="ghost"
              type="button"
              onClick={() => onOpenChange(false)}
              disabled={pending}
            >
              Cancelar
            </Button>
            <Button variant="premium" type="submit" disabled={!isValid || pending}>
              {pending ? <Loader2 className="size-4 animate-spin" /> : null}
              Salvar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
