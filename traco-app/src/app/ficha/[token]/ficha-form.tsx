'use client';

import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMemo, useRef, useState, useTransition } from 'react';
import SignatureCanvas from 'react-signature-canvas';
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
import { FieldTermAcceptance } from '@/components/anamnesis/fields/field-term-acceptance';
import { FieldText } from '@/components/anamnesis/fields/field-text';
import { FieldTextarea } from '@/components/anamnesis/fields/field-textarea';
import { buildAnamnesisSchema } from '@/lib/anamnesis/build-zod-schema';
import type {
  AnamnesisAnswers,
  FieldValue,
  TemplateField,
} from '@/lib/anamnesis/template-types';
import { submitAnamnesisForm } from '@/server/actions/anamnesis';

type Props = {
  token: string;
  fields: TemplateField[];
  initialAnswers: AnamnesisAnswers;
};

function defaultFor(field: TemplateField, prefilled: AnamnesisAnswers): FieldValue {
  const seed = prefilled[field.id];
  if (seed !== undefined) return seed;
  switch (field.type) {
    case 'boolean':
      return undefined;
    case 'boolean_with_text':
      return undefined;
    case 'term_acceptance':
      return false;
    default:
      return '';
  }
}

export function FichaForm({ token, fields, initialAnswers }: Props) {
  const router = useRouter();
  const schema = useMemo(() => buildAnamnesisSchema(fields), [fields]);
  const [answers, setAnswers] = useState<AnamnesisAnswers>(() => {
    const seeded: AnamnesisAnswers = {};
    for (const f of fields) {
      if (f.type === 'section') continue;
      seeded[f.id] = defaultFor(f, initialAnswers);
    }
    return seeded;
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [signatureEmpty, setSignatureEmpty] = useState(true);
  const [signatureTouched, setSignatureTouched] = useState(false);
  const [isPending, startTransition] = useTransition();
  const sigRef = useRef<SignatureCanvas>(null);

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

  function clearSignature() {
    sigRef.current?.clear();
    setSignatureEmpty(true);
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

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

    const sig = sigRef.current;
    if (!sig || sig.isEmpty()) {
      setSignatureTouched(true);
      toast.error('Assinatura é obrigatória — assine no quadro abaixo.');
      sig?.getCanvas()?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    const signaturePng = sig.toDataURL('image/png');

    startTransition(async () => {
      const submitResult = await submitAnamnesisForm({
        token,
        answers: answers as Record<string, unknown>,
        signature_png: signaturePng,
      });

      if (submitResult.success) {
        router.push(`/ficha/${token}/sucesso`);
      } else {
        toast.error(submitResult.error || 'Não foi possível enviar.');
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-7">
      {fields.map((field) => {
        if (field.type === 'section') {
          return <FieldSection key={field.id} field={field} />;
        }
        const error = errors[field.id];
        const value = answers[field.id];
        return renderField(field, value, (next) => setValue(field.id, next), error, isPending);
      })}

      <div
        className={`bg-card flex flex-col gap-2 rounded-lg border p-5 transition-colors ${
          signatureTouched && signatureEmpty
            ? 'border-destructive/60 ring-2 ring-destructive/20'
            : 'border-[var(--gold)]/20'
        }`}
      >
        <h2 className="font-serif text-lg font-medium text-foreground">
          Sua assinatura <span className="text-destructive">*</span>
        </h2>
        <p className="text-xs text-muted-foreground">
          Campo obrigatório. Assine no quadro abaixo com o dedo.
        </p>
        <div className="overflow-hidden rounded-lg border-2 border-[var(--gold)]/40 bg-white">
          <SignatureCanvas
            ref={sigRef}
            penColor="#0A0A0A"
            backgroundColor="#FFFFFF"
            canvasProps={{
              className: 'block w-full h-[200px] touch-none',
            }}
            onEnd={() => {
              setSignatureEmpty(false);
              setSignatureTouched(true);
            }}
          />
        </div>
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={clearSignature}
            disabled={signatureEmpty}
            className="text-xs uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:text-[var(--gold)] disabled:opacity-40"
          >
            Limpar
          </button>
        </div>
        {signatureTouched && signatureEmpty ? (
          <p className="text-xs font-medium text-destructive">
            Assine antes de enviar a ficha.
          </p>
        ) : null}
      </div>

      <p className="text-xs leading-relaxed text-muted-foreground">
        Ao assinar, você confirma que as informações são verdadeiras e autoriza o procedimento.
      </p>

      <button
        type="submit"
        disabled={isPending || signatureEmpty}
        className="bg-[var(--gold)] text-ink hover:bg-[var(--gold-dark)] hover:text-cream flex h-14 items-center justify-center gap-2 rounded-lg text-sm font-medium uppercase tracking-[0.2em] transition-colors disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Enviando...
          </>
        ) : signatureEmpty ? (
          'Assine para continuar'
        ) : (
          'Assinar e enviar'
        )}
      </button>
    </form>
  );
}

function renderField(
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
          onChange={(next) => onChange(next)}
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
          onChange={(next) => onChange(next)}
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
          onChange={(next) => onChange(next)}
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
          onChange={(next) => onChange(next)}
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
          onChange={(next) => onChange(next)}
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
          onChange={(next) => onChange(next)}
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
          onChange={(next) => onChange(next)}
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
          onChange={(next) => onChange(next)}
          error={error}
          disabled={disabled}
        />
      );
    case 'term_acceptance':
      return (
        <FieldTermAcceptance
          key={key}
          field={field}
          value={Boolean(value)}
          onChange={(next) => onChange(next)}
          error={error}
          disabled={disabled}
        />
      );
    default:
      return null;
  }
}
