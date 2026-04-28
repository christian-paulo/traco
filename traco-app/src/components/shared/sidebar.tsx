'use client';

import {
  CalendarCheck,
  Clock,
  LayoutDashboard,
  LogOut,
  Settings,
  TrendingUp,
  Users,
  type LucideIcon,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { signOut } from '@/server/actions/auth';

type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

const NAV: NavItem[] = [
  { label: 'Início', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Clientes', href: '/dashboard/clientes', icon: Users },
  { label: 'Atendimentos', href: '/dashboard/atendimentos', icon: CalendarCheck },
  { label: 'Recuperar', href: '/dashboard/recuperar', icon: Clock },
  { label: 'Financeiro', href: '/dashboard/financeiro', icon: TrendingUp },
  { label: 'Configurações', href: '/dashboard/configuracoes', icon: Settings },
];

export type SidebarProfile = {
  fullName: string | null;
  email: string;
  avatarUrl: string | null;
};

type SidebarProps = {
  profile: SidebarProfile;
  onNavigate?: () => void;
};

function isActive(pathname: string, href: string) {
  if (href === '/dashboard') return pathname === '/dashboard';
  return pathname === href || pathname.startsWith(`${href}/`);
}

function getInitials(profile: SidebarProfile) {
  const source = profile.fullName?.trim() || profile.email;
  const parts = source.split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase() || source[0]?.toUpperCase() || '?';
}

export function Sidebar({ profile, onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const initials = getInitials(profile);
  const displayName = profile.fullName?.trim() || profile.email;

  return (
    <div className="bg-ink scrollbar-dark flex h-full flex-col p-6">
      <div className="mb-8 flex flex-col">
        <span className="font-serif text-3xl font-light tracking-wide text-[var(--gold)]">
          Traço
        </span>
        <span className="mt-1 text-[10px] font-light uppercase tracking-[0.3em] text-white/60">
          by Master Brow
        </span>
        <div className="mt-6 h-px w-12 bg-[var(--gold)]/60" />
      </div>

      <nav className="flex flex-col gap-1">
        {NAV.map((item) => {
          const active = isActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'group/nav-item relative flex items-center gap-3 rounded-r-md px-4 py-3 text-sm uppercase tracking-[0.1em] transition-colors',
                active
                  ? 'border-l-2 border-[var(--gold)] bg-[var(--gold)]/10 font-medium text-[var(--gold)]'
                  : 'border-l-2 border-transparent text-white/70 hover:bg-white/5 hover:text-[var(--gold)]',
              )}
            >
              <Icon className="size-[18px] shrink-0" strokeWidth={1.5} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto pt-6">
        <div className="mb-4 h-px w-full bg-[var(--gold)]/20" />
        <div className="flex items-center gap-3">
          <Avatar className="size-10 border-2 border-[var(--gold)]/40">
            {profile.avatarUrl ? <AvatarImage src={profile.avatarUrl} alt={displayName} /> : null}
            <AvatarFallback className="bg-[var(--gold)]/15 text-[var(--gold)] text-xs font-medium">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-white">{displayName}</p>
            <p className="truncate text-xs text-white/50">{profile.email}</p>
          </div>
          <form action={signOut}>
            <Button
              type="submit"
              variant="ghost"
              size="icon"
              aria-label="Sair"
              className="size-9 text-[var(--gold)] hover:bg-[var(--gold)]/10 hover:text-[var(--gold)]"
            >
              <LogOut className="size-4" strokeWidth={1.5} />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
