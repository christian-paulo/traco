'use client';

import { Loader2 } from 'lucide-react';
import { useEffect, useMemo, useState, useTransition } from 'react';
import { toast } from 'sonner';

import { FieldBoolean } from '@/components/anamnesis/fields/field-boolean';
import {
  FieldBooleanWithText,
  type BooleanWithText,
} from '@/components/anamnesis/fields/field-boolean-with-text';
import { FieldCPF } from '@/components/anamnesis/fields/field-cpf';
import { FieldDate } from '@/components/anamnesis/fields/field-date';
import { FieldPhone } from '@/components/anamnesis/fields/field-phone';
import { FieldSection } from '@/components/anamnesis/fields/field-section';
import { FieldSelect } from '@/components/anamnesis/fields/field-select';
import { FieldText } from '@/components/anamnesis/fields/field-text';
import { FieldTextarea } from '@/components/anamnesis/fields/field-textarea';
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
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { buildAnamnesisSchema } from '@/lib/anamnesis/build-zod-schema';
import type {
  AnamnesisAnswers,
  FieldValue,
  TemplateField,
} from '@/lib/anamnesis/template-types';
import { editFormVersion } from '@/server/actions/anamnesis';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formId: string;
  templateFields: TemplateField[];
  initialAnswers: AnamnesisAnswers;
};

const REASON_PRESETS = [
  'Cliente preencheu errado',
  'Informação adicional fornecida durante atendimento',
  'Atualização de contato',
  'Outro',
];

function isEditableField(field: TemplateField): boolean {
  if (field.type === 'section') return false;
  if (field.type === 'term_acceptance') return false;
  if (field.id === 'f_termo') return false;
  return true;
}

function defaultFor(field: TemplateField, seedAnswers: AnamnesisAnswers): FieldValue {
  const seed = seedAnswers[field.id];
  if (seed !== undefined) return seed;
  switch (field.type) {
    case 'boolean':
    case 'boolean_with_text':
      return undefined;
    case 'term_acceptance':
      return false;
    default:
      return '';
  }
}

export function EditFichaDialog({
  open,
  onOpenChange,
  formId,
  templateFields,
  initialAnswers,
}: Props) {
  const schema = useMemo(
    () => buildAnamnesisSchema(templateFields as TemplateField[]),
    [templateFields],
  );
  const [answers, setAnswers] = useState<AnamnesisAnswers>(() => {
    const seeded: AnamnesisAnswers = {};
    for (const f of templateFields) {
      if (f.type === 'section') continue;
      seeded[f.id] = defaultFor(f, initialAnswers);
    }
    return seeded;
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [reasonChoice, setReasonChoice] = useState<string>(REASON_PRESETS[0]);
  const [reasonOther, setReasonOther] = useState('');
  const [pending, startTransition] = useTransition();

  // Resetar estado ao abrir
  useEffect(() => {
    if (!open) return;
    const seeded: AnamnesisAnswers = {};
    for (const f of templateFields) {
      if (f.type === 'section') continue;
      seeded[f.id] = defaultFor(f, initialAnswers);
    }
    setAnswers(seeded);
    setErrors({});
    setReasonChoice(REASON_PRESETS[0]);
    setReasonOther('');
  }, [open, templateFields, initialAnswers]);

  function setValue(id: string, value: FieldValue) {
    setAnswers((prev) => ({ ...prev, [id]: value }));
    if (errors[id]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }
  }

  const finalReason =
    reasonChoice === 'Outro' ? reasonOther.trim() : reasonChoice;
  const reasonValid = finalReason.length >= 3;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!reasonValid) {
      toast.error('Informe o motivo da edição.');
      return;
    }
    const result = schema.safeParse(answers);
    if (!result.success) {
      const next: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0];
        if (typeof key === 'string') next[key] = issue.message;
      }
      setErrors(next);
      toast.error('Confira os campos destacados.');
      return;
    }

    startTransition(async () => {
      const r = await editFormVersion({
        formId,
        answers: answers as Record<string, unknown>,
        editReason: finalReason,
      });
      if (r.success) {
        toast.success(`Nova versão criada (versão ${r.data.versionNumber})`);
        onOpenChange(false);
      } else {
        toast.error(r.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Editar ficha de anamnese</DialogTitle>
          <DialogDescription>
            Esta edição cria uma nova versão. A versão original assinada permanece imutável.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <DialogBody>
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs uppercase tracking-[0.16em] text-amber-800">
                    Motivo da edição <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={reasonChoice}
                    onValueChange={(v) => setReasonChoice(v ?? REASON_PRESETS[0])}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {REASON_PRESETS.map((r) => (
                        <SelectItem key={r} value={r}>
                          {r}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {reasonChoice === 'Outro' ? (
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs uppercase tracking-[0.16em] text-amber-800">
                      Descreva o motivo <span className="text-destructive">*</span>
                    </Label>
                    <Textarea
                      rows={2}
                      value={reasonOther}
                      onChange={(e) => setReasonOther(e.target.value)}
                      placeholder="Ex: Correção de informação relatada durante atendimento."
                      maxLength={500}
                      disabled={pending}
                    />
                  </div>
                ) : null}
              </div>

              <div className="flex flex-col gap-5">
                {templateFields.map((field) => {
                  if (!isEditableField(field)) {
                    if (field.type === 'section') {
                      return <FieldSection key={field.id} field={field} />;
                    }
                    return null;
                  }
                  const error = errors[field.id];
                  const value = answers[field.id];
                  return renderEditableField(
                    field,
                    value,
                    (next) => setValue(field.id, next),
                    error,
                    pending,
                  );
                })}
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
            <Button
              variant="premium"
              type="submit"
              disabled={pending || !reasonValid}
            >
              {pending ? <Loader2 className="size-4 animate-spin" /> : null}
              Salvar nova versão
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function renderEditableField(
  field: TemplateField,
  value: FieldValue,
  onChange: (next: FieldValue) => void,
  error: string | undefined,
  disabled: boolean,
) {
  const key = field.id;
  switch (field.type) {
    case 'text':
      return (
        <FieldText
          key={key}
          field={field}
          value={(value as string | undefined) ?? ''}
          onChange={onChange}
          error={error}
          disabled={disabled}
        />
      );
    case 'textarea':
      return (
        <FieldTextarea
          key={key}
          field={field}
          value={(value as string | undefined) ?? ''}
          onChange={onChange}
          error={error}
          disabled={disabled}
        />
      );
    case 'date':
      return (
        <FieldDate
          key={key}
          field={field}
          value={(value as string | undefined) ?? ''}
          onChange={onChange}
          error={error}
          disabled={disabled}
        />
      );
    case 'phone':
      return (
        <FieldPhone
          key={key}
          field={field}
          value={(value as string | undefined) ?? ''}
          onChange={onChange}
          error={error}
          disabled={disabled}
        />
      );
    case 'cpf':
      return (
        <FieldCPF
          key={key}
          field={field}
          value={(value as string | undefined) ?? ''}
          onChange={onChange}
          error={error}
          disabled={disabled}
        />
      );
    case 'boolean':
      return (
        <FieldBoolean
          key={key}
          field={field}
          value={value as boolean | undefined}
          onChange={onChange}
          error={error}
          disabled={disabled}
        />
      );
    case 'boolean_with_text':
      return (
        <FieldBooleanWithText
          key={key}
          field={field}
          value={value as BooleanWithText | undefined}
          onChange={onChange}
          error={error}
          disabled={disabled}
        />
      );
    case 'select':
      return (
        <FieldSelect
          key={key}
          field={field}
          value={(value as string | undefined) ?? ''}
          onChange={onChange}
          error={error}
          disabled={disabled}
        />
      );
    default:
      return null;
  }
}
