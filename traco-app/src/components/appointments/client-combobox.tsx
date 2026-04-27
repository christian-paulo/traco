'use client';

import { Check, ChevronsUpDown } from 'lucide-react';
import { useState } from 'react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { getInitials } from '@/lib/format';
import { cn } from '@/lib/utils';

export type ClientLite = {
  id: string;
  full_name: string;
  phone: string;
};

type Props = {
  clients: ClientLite[];
  value: string | null;
  onChange: (id: string) => void;
  disabled?: boolean;
};

export function ClientCombobox({ clients, value, onChange, disabled }: Props) {
  const [open, setOpen] = useState(false);
  const selected = clients.find((c) => c.id === value) ?? null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            className="h-11 w-full justify-between"
          >
            {selected ? (
              <span className="flex items-center gap-2">
                <Avatar className="size-6 border border-[var(--gold)]/30">
                  <AvatarFallback className="bg-cream text-[var(--gold)] text-[10px]">
                    {getInitials(selected.full_name)}
                  </AvatarFallback>
                </Avatar>
                <span>{selected.full_name}</span>
              </span>
            ) : (
              <span className="text-muted-foreground">Selecione uma cliente...</span>
            )}
            <ChevronsUpDown className="size-4 text-muted-foreground" />
          </Button>
        }
      />
      <PopoverContent className="w-[var(--popover-anchor-width)] min-w-[280px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Buscar cliente..." />
          <CommandList className="max-h-64">
            <CommandEmpty>
              <span className="font-serif italic text-muted-foreground">
                Cliente não encontrada — cadastre primeiro.
              </span>
            </CommandEmpty>
            <CommandGroup>
              {clients.map((c) => (
                <CommandItem
                  key={c.id}
                  value={`${c.full_name} ${c.phone}`}
                  onSelect={() => {
                    onChange(c.id);
                    setOpen(false);
                  }}
                  className="gap-3"
                >
                  <Avatar className="size-7 border border-[var(--gold)]/30">
                    <AvatarFallback className="bg-cream text-[var(--gold)] text-[11px]">
                      {getInitials(c.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate text-sm font-medium text-foreground">
                      {c.full_name}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">{c.phone}</span>
                  </div>
                  <Check
                    className={cn(
                      'ml-auto size-4 text-[var(--gold)]',
                      value === c.id ? 'opacity-100' : 'opacity-0',
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
