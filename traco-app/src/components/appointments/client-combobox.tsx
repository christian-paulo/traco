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
            className="h-12 w-full justify-between bg-card border-cream-dark px-3 hover:bg-card hover:border-[var(--gold)]/50"
          >
            {selected ? (
              <span className="flex min-w-0 items-center gap-3 text-left">
                <Avatar className="size-8 shrink-0 border border-[var(--gold)]/40">
                  <AvatarFallback className="bg-cream text-[var(--gold)] text-[11px] font-medium">
                    {getInitials(selected.full_name)}
                  </AvatarFallback>
                </Avatar>
                <span className="flex min-w-0 flex-col">
                  <span className="truncate text-sm font-medium text-foreground">
                    {selected.full_name}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {selected.phone}
                  </span>
                </span>
              </span>
            ) : (
              <span className="text-muted-foreground/70">Buscar cliente...</span>
            )}
            <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />
          </Button>
        }
      />
      <PopoverContent
        className="w-(--anchor-width) min-w-[280px] p-0"
        align="start"
        sideOffset={6}
      >
        <Command>
          <CommandInput placeholder="Buscar por nome ou telefone..." />
          <CommandList className="max-h-72">
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
                  className="gap-3 px-3 py-2.5 hover:bg-cream"
                >
                  <Avatar className="size-8 shrink-0 border border-[var(--gold)]/30">
                    <AvatarFallback className="bg-cream text-[var(--gold)] text-[11px] font-medium">
                      {getInitials(c.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-sm font-medium text-foreground">
                      {c.full_name}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">{c.phone}</span>
                  </div>
                  <Check
                    className={cn(
                      'ml-auto size-4 shrink-0 text-[var(--gold)]',
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
