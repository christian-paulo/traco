'use client';

import {
  AlertCircle,
  CalendarCheck,
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
import { Separator } from '@/components/ui/separator';
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
    <div className="flex h-full flex-col bg-white p-4">
      <div className="mb-3 px-2">
        <span className="text-2xl font-bold tracking-tight text-slate-900">Traço</span>
      </div>
      <Separator className="mb-4" />
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
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                active
                  ? 'bg-slate-100 font-medium text-slate-900'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
              )}
            >
              <Icon className="size-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto">
        <Separator className="mb-4" />
        <div className="flex items-center gap-3 px-2 py-1">
          <Avatar className="size-9">
            {profile.avatarUrl ? <AvatarImage src={profile.avatarUrl} alt={displayName} /> : null}
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-slate-900">{displayName}</p>
            <p className="truncate text-xs text-slate-500">{profile.email}</p>
          </div>
          <form action={signOut}>
            <Button
              type="submit"
              variant="ghost"
              size="icon"
              aria-label="Sair"
              className="size-8 text-slate-500 hover:text-slate-900"
            >
              <LogOut className="size-4" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
