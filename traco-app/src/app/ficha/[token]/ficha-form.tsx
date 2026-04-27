'use client';

import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useRef, useState, useTransition } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { toast } from 'sonner';

import { cn } from '@/lib/utils';
import { submitAnamnesisForm } from '@/server/actions/anamnesis';

import type { AnamnesisField } from '@/lib/queries/anamnesis';

type Props = {
  token: string;
  fields: AnamnesisField[];
};

type Answers = Record<string, string | boolean>;

const inputClass =
  'w-full h-12 rounded-lg border border-[var(--gold)]/30 bg-white px-4 text-base text-foreground outline-none transition-colors focus:border-[var(--gold)] focus:ring-2 focus:ring-[var(--gold)]/30';

export function FichaForm({ token, fields }: Props) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Answers>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [signatureEmpty, setSignatureEmpty] = useState(true);
  const [isPending, startTransition] = useTransition();
  const sigRef = useRef<SignatureCanvas>(null);

  function setValue(id: string, value: string | boolean) {
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

  function validate(): boolean {
    const next: Record<string, string> = {};
    for (const field of fields) {
      if (!field.required) continue;
      const value = answers[field.id];
      if (value === undefined || value === '' || value === null) {
        next[field.id] = 'Campo obrigatório.';
      }
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!validate()) {
      toast.error('Preencha todos os campos obrigatórios.');
      return;
    }

    const sig = sigRef.current;
    if (!sig || sig.isEmpty()) {
      toast.error('Por favor, assine antes de enviar.');
      return;
    }

    const signaturePng = sig.toDataURL('image/png');

    startTransition(async () => {
      const result = await submitAnamnesisForm({
        token,
        answers,
        signature_png: signaturePng,
      });

      if (result.success) {
        router.push(`/ficha/${token}/sucesso`);
      } else {
        toast.error(result.error || 'Não foi possível enviar.');
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-7">
      {fields.map((field) => (
        <div key={field.id} className="flex flex-col gap-2">
          <label htmlFor={field.id} className="font-serif text-base text-foreground">
            {field.label}
            {field.required ? <span className="text-destructive/80"> *</span> : null}
          </label>
          {renderControl(field, answers, setValue, isPending, inputClass)}
          {errors[field.id] ? (
            <p className="text-destructive text-xs">{errors[field.id]}</p>
          ) : null}
        </div>
      ))}

      <div className="bg-card flex flex-col gap-2 rounded-lg border border-[var(--gold)]/20 p-5">
        <h2 className="font-serif text-lg font-medium text-foreground">Sua assinatura</h2>
        <p className="text-xs text-muted-foreground">Assine no quadro abaixo com o dedo.</p>
        <div className="overflow-hidden rounded-lg border-2 border-[var(--gold)]/40 bg-white">
          <SignatureCanvas
            ref={sigRef}
            penColor="#0A0A0A"
            backgroundColor="#FFFFFF"
            canvasProps={{
              className: 'block w-full h-[200px] touch-none',
            }}
            onEnd={() => setSignatureEmpty(false)}
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
      </div>

      <p className="text-xs leading-relaxed text-muted-foreground">
        Ao assinar, você confirma que as informações são verdadeiras e autoriza o procedimento.
      </p>

      <button
        type="submit"
        disabled={isPending}
        className="bg-[var(--gold)] text-ink hover:bg-[var(--gold-dark)] hover:text-cream flex h-14 items-center justify-center gap-2 rounded-lg text-sm font-medium uppercase tracking-[0.2em] transition-colors disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Enviando...
          </>
        ) : (
          'Assinar e enviar'
        )}
      </button>
    </form>
  );
}

function renderControl(
  field: AnamnesisField,
  answers: Answers,
  setValue: (id: string, value: string | boolean) => void,
  disabled: boolean,
  className: string,
) {
  const value = answers[field.id];

  if (field.type === 'textarea') {
    return (
      <textarea
        id={field.id}
        value={(value as string) ?? ''}
        onChange={(e) => setValue(field.id, e.target.value)}
        disabled={disabled}
        rows={3}
        className={cn(
          className,
          'h-auto py-3 leading-relaxed',
        )}
      />
    );
  }

  if (field.type === 'date') {
    return (
      <input
        id={field.id}
        type="date"
        value={(value as string) ?? ''}
        onChange={(e) => setValue(field.id, e.target.value)}
        disabled={disabled}
        className={className}
      />
    );
  }

  if (field.type === 'boolean') {
    const current = value === true ? 'sim' : value === false ? 'nao' : '';
    return (
      <div className="grid grid-cols-2 gap-2">
        {(['sim', 'nao'] as const).map((opt) => (
          <button
            key={opt}
            type="button"
            disabled={disabled}
            onClick={() => setValue(field.id, opt === 'sim')}
            className={cn(
              'flex h-12 items-center justify-center rounded-lg border-2 text-sm font-medium uppercase tracking-[0.1em] transition-colors',
              current === opt
                ? 'border-[var(--gold)] bg-[var(--gold)]/15 text-foreground'
                : 'border-[var(--gold)]/20 bg-white text-muted-foreground hover:border-[var(--gold)]/50 hover:text-foreground',
            )}
          >
            {opt === 'sim' ? 'Sim' : 'Não'}
          </button>
        ))}
      </div>
    );
  }

  if (field.type === 'select') {
    return (
      <select
        id={field.id}
        value={(value as string) ?? ''}
        onChange={(e) => setValue(field.id, e.target.value)}
        disabled={disabled}
        className={className}
      >
        <option value="">Selecione</option>
        {(field.options ?? []).map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    );
  }

  return (
    <input
      id={field.id}
      type="text"
      value={(value as string) ?? ''}
      onChange={(e) => setValue(field.id, e.target.value)}
      disabled={disabled}
      className={className}
    />
  );
}
