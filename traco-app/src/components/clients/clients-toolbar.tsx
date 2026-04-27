'use client';

import { Search, X } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const ALL_TAGS_VALUE = '__all__';

type Props = {
  initialSearch: string;
  initialTag: string;
  availableTags: string[];
};

export function ClientsToolbar({ initialSearch, initialTag, availableTags }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const [search, setSearch] = useState(initialSearch);

  useEffect(() => {
    const t = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (search.trim()) params.set('search', search.trim());
      else params.delete('search');
      const qs = params.toString();
      startTransition(() => {
        router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
      });
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  function setTag(value: string | null) {
    const next = value ?? '';
    const params = new URLSearchParams(searchParams.toString());
    if (next && next !== ALL_TAGS_VALUE) params.set('tag', next);
    else params.delete('tag');
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  const tagValue = initialTag || ALL_TAGS_VALUE;

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <Search className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nome ou telefone..."
          className="h-11 pl-9 pr-9"
        />
        {search ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Limpar busca"
            onClick={() => setSearch('')}
            className="absolute right-1 top-1/2 size-8 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="size-4" />
          </Button>
        ) : null}
      </div>
      <Select value={tagValue} onValueChange={setTag}>
        <SelectTrigger className="h-11 sm:w-56">
          <SelectValue placeholder="Todas as tags" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_TAGS_VALUE}>Todas as tags</SelectItem>
          {availableTags.map((tag) => (
            <SelectItem key={tag} value={tag}>
              {tag}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
