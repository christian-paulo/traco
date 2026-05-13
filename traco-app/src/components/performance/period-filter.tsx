'use client';

import { CalendarDays, ChevronDown } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useState, useTransition } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import {
  PERIOD_PRESETS,
  type PeriodPreset,
  type ResolvedRange,
} from '@/lib/performance/period';

type Props = {
  current: ResolvedRange;
};

export function PeriodFilter({ current }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const [customOpen, setCustomOpen] = useState(false);
  const [customFrom, setCustomFrom] = useState(current.fromDate);
  const [customTo, setCustomTo] = useState(current.toDate);

  function setPreset(preset: PeriodPreset) {
    const params = new URLSearchParams(searchParams.toString());
    params.set('range', preset);
    if (preset !== 'personalizado') {
      params.delete('from');
      params.delete('to');
    }
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    });
  }

  function applyCustom() {
    const params = new URLSearchParams(searchParams.toString());
    params.set('range', 'personalizado');
    params.set('from', customFrom);
    params.set('to', customTo);
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    });
    setCustomOpen(false);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="-mx-1 flex snap-x snap-mandatory items-center gap-1.5 overflow-x-auto px-1 py-1">
        {PERIOD_PRESETS.map((preset) => {
          const isActive = current.preset === preset.key;
          const isCustom = preset.key === 'personalizado';
          if (isCustom) {
            return (
              <Popover key={preset.key} open={customOpen} onOpenChange={setCustomOpen}>
                <PopoverTrigger
                  render={
                    <button
                      type="button"
                      className={cn(
                        'flex shrink-0 snap-start items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors',
                        isActive
                          ? 'border-foreground bg-foreground text-background'
                          : 'border-cream-dark bg-card text-foreground hover:bg-cream/60',
                      )}
                    >
                      <CalendarDays className="size-3.5" />
                      {isActive ? current.label : preset.label}
                      <ChevronDown className="size-3" />
                    </button>
                  }
                />
                <PopoverContent align="end" sideOffset={6} className="w-72 p-3">
                  <div className="flex flex-col gap-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex flex-col gap-1">
                        <Label className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                          De
                        </Label>
                        <Input
                          type="date"
                          value={customFrom}
                          onChange={(e) => setCustomFrom(e.target.value)}
                          className="h-9"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <Label className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                          Até
                        </Label>
                        <Input
                          type="date"
                          value={customTo}
                          onChange={(e) => setCustomTo(e.target.value)}
                          className="h-9"
                        />
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="premium"
                      size="sm"
                      onClick={applyCustom}
                      disabled={!customFrom || !customTo || customFrom > customTo}
                    >
                      Aplicar período
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            );
          }

          return (
            <button
              key={preset.key}
              type="button"
              onClick={() => setPreset(preset.key)}
              className={cn(
                'shrink-0 snap-start rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors',
                isActive
                  ? 'border-foreground bg-foreground text-background'
                  : 'border-cream-dark bg-card text-foreground hover:bg-cream/60',
              )}
            >
              {preset.label}
            </button>
          );
        })}
      </div>
      <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
        {current.label}
      </p>
    </div>
  );
}
