'use client';

import { Search, X } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { DateRangePicker } from '@/components/financial/date-range-picker';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  EXPENSE_CATEGORIES,
  EXPENSE_CATEGORY_LABELS,
  type ExpenseCategory,
} from '@/lib/validations/expense';

type Props = {
  initialFrom: string;
  initialTo: string;
  initialCategory: ExpenseCategory | 'all';
  initialSearch: string;
};

export function ExpensesToolbar({
  initialFrom,
  initialTo,
  initialCategory,
  initialSearch,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(initialSearch);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      const trimmed = searchTerm.trim();
      if (trimmed) params.set('q', trimmed);
      else params.delete('q');
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  function handleCategory(next: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (!next || next === 'all') params.delete('cat');
    else params.set('cat', next);
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-3">
      <DateRangePicker initialFrom={initialFrom} initialTo={initialTo} />

      <Select
        value={initialCategory}
        onValueChange={(v) => handleCategory(v ?? 'all')}
      >
        <SelectTrigger className="h-11 sm:w-56">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas as categorias</SelectItem>
          {EXPENSE_CATEGORIES.map((c) => (
            <SelectItem key={c} value={c}>
              {EXPENSE_CATEGORY_LABELS[c]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="relative flex-1 sm:max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar por descrição…"
          className="h-11 pl-9 pr-9"
        />
        {searchTerm ? (
          <button
            type="button"
            onClick={() => setSearchTerm('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:bg-cream-dark/40"
            aria-label="Limpar busca"
          >
            <X className="size-3.5" />
          </button>
        ) : null}
      </div>
    </div>
  );
}
