'use client';

import { Menu } from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { SheetTrigger } from '@/components/ui/sheet';

import type { SidebarProfile } from './sidebar';

type TopbarProps = {
  profile: SidebarProfile;
};

function getInitials(profile: SidebarProfile) {
  const source = profile.fullName?.trim() || profile.email;
  const parts = source.split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase() || source[0]?.toUpperCase() || '?';
}

export function Topbar({ profile }: TopbarProps) {
  const initials = getInitials(profile);
  const displayName = profile.fullName?.trim() || profile.email;

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4 lg:hidden">
      <SheetTrigger
        render={
          <Button variant="ghost" size="icon" aria-label="Abrir menu" className="size-9">
            <Menu className="size-5" />
          </Button>
        }
      />
      <span className="text-lg font-bold tracking-tight text-slate-900">Traço</span>
      <Avatar className="size-8">
        {profile.avatarUrl ? <AvatarImage src={profile.avatarUrl} alt={displayName} /> : null}
        <AvatarFallback className="text-xs">{initials}</AvatarFallback>
      </Avatar>
    </header>
  );
}
