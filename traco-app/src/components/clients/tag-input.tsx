'use client';

import { X } from 'lucide-react';
import { useId, useMemo, useRef, useState, type KeyboardEvent } from 'react';

import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { getSuggestedTags } from '@/lib/utils/tag-suggestions';

type TagInputProps = {
  value: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
  placeholder?: string;
  id?: string;
};

export function TagInput({ value, onChange, disabled, placeholder, id }: TagInputProps) {
  const [draft, setDraft] = useState('');
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const fallbackId = useId();
  const inputId = id ?? fallbackId;

  const suggestions = useMemo(() => getSuggestedTags(value, draft).slice(0, 6), [value, draft]);

  function commit(tag: string) {
    const trimmed = tag.trim();
    if (!trimmed) return;
    if (value.some((t) => t.toLowerCase() === trimmed.toLowerCase())) return;
    onChange([...value, trimmed]);
    setDraft('');
    setOpen(false);
    inputRef.current?.focus();
  }

  function remove(idx: number) {
    onChange(value.filter((_, i) => i !== idx));
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      if (draft.trim()) {
        e.preventDefault();
        commit(draft);
      }
    } else if (e.key === 'Backspace' && draft === '' && value.length > 0) {
      remove(value.length - 1);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  }

  return (
    <div className="relative">
      <div
        className={cn(
          'flex min-h-11 flex-wrap items-center gap-1.5 rounded-md border border-input bg-card px-2 py-1.5 text-sm transition-colors focus-within:border-[var(--gold)] focus-within:ring-2 focus-within:ring-[var(--gold)]/30',
          disabled && 'pointer-events-none opacity-60',
        )}
      >
        {value.map((tag, idx) => (
          <Badge
            key={`${tag}-${idx}`}
            variant="outline"
            className="gap-1 border-[var(--gold)]/40 bg-[var(--gold)]/10 text-foreground"
          >
            {tag}
            <button
              type="button"
              aria-label={`Remover tag ${tag}`}
              onClick={() => remove(idx)}
              className="rounded-full text-muted-foreground transition-colors hover:text-foreground"
            >
              <X className="size-3" />
            </button>
          </Badge>
        ))}
        <Input
          ref={inputRef}
          id={inputId}
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 120)}
          onKeyDown={onKeyDown}
          placeholder={value.length === 0 ? (placeholder ?? 'Digite e pressione Enter') : ''}
          disabled={disabled}
          className="h-7 flex-1 min-w-[140px] border-0 bg-transparent px-1 shadow-none focus-visible:ring-0"
        />
      </div>

      {open && suggestions.length > 0 ? (
        <ul className="bg-popover absolute z-20 mt-1 w-full overflow-hidden rounded-md border border-[var(--gold)]/20 shadow-md">
          {suggestions.map((s) => (
            <li key={s}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => commit(s)}
                className="hover:bg-cream-dark flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-foreground transition-colors"
              >
                <span className="size-1.5 rounded-full bg-[var(--gold)]" />
                {s}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
