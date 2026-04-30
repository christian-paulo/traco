'use client';

import {
  AlertTriangle,
  FileText,
  History,
  Image as ImageIcon,
  LayoutDashboard,
  Sparkles,
  StickyNote,
  type LucideIcon,
} from 'lucide-react';

import { cn } from '@/lib/utils';

export type TabKey =
  | 'resumo'
  | 'ficha'
  | 'historico'
  | 'procedimento'
  | 'reacoes'
  | 'fotos'
  | 'notas';

type TabDef = {
  key: TabKey;
  label: string;
  icon: LucideIcon;
};

const TABS: TabDef[] = [
  { key: 'resumo', label: 'Resumo', icon: LayoutDashboard },
  { key: 'ficha', label: 'Ficha', icon: FileText },
  { key: 'historico', label: 'Histórico', icon: History },
  { key: 'procedimento', label: 'Procedimento', icon: Sparkles },
  { key: 'reacoes', label: 'Reações', icon: AlertTriangle },
  { key: 'fotos', label: 'Fotos', icon: ImageIcon },
  { key: 'notas', label: 'Notas', icon: StickyNote },
];

export const TAB_KEYS: readonly TabKey[] = TABS.map((t) => t.key);

type Props = {
  active: TabKey;
  onChange: (next: TabKey) => void;
  activeReactionCount: number;
  pinnedNoteCount: number;
};

export function AtendimentoTabs({
  active,
  onChange,
  activeReactionCount,
  pinnedNoteCount,
}: Props) {
  return (
    <nav className="bg-cream-dark/60 sticky top-[57px] z-20 border-b border-[var(--gold)]/30 sm:top-[60px]">
      <div className="mx-auto flex max-w-5xl gap-1 overflow-x-auto px-4 sm:px-6">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = active === tab.key;
          const badge =
            tab.key === 'reacoes'
              ? activeReactionCount
              : tab.key === 'notas'
                ? pinnedNoteCount
                : 0;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => onChange(tab.key)}
              className={cn(
                'group flex shrink-0 items-center gap-2 border-b-2 px-3 py-3 text-xs font-medium uppercase tracking-[0.1em] transition-colors sm:px-4 sm:text-sm',
                isActive
                  ? 'border-[var(--gold)] text-foreground'
                  : 'border-transparent text-foreground/60 hover:text-foreground',
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon className="size-4" strokeWidth={1.75} />
              {tab.label}
              {badge > 0 ? (
                <span className="bg-[var(--gold)] text-ink ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-medium tracking-normal">
                  {badge}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
