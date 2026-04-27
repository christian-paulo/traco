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
    <header className="bg-ink sticky top-0 z-30 flex h-14 items-center justify-between border-b border-[var(--gold)]/20 px-4 lg:hidden">
      <SheetTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            aria-label="Abrir menu"
            className="size-9 text-white hover:bg-white/10 hover:text-[var(--gold)]"
          >
            <Menu className="size-5" strokeWidth={1.5} />
          </Button>
        }
      />
      <span className="font-serif text-2xl font-light tracking-wide text-[var(--gold)]">
        Traço
      </span>
      <Avatar className="size-8 border border-[var(--gold)]/40">
        {profile.avatarUrl ? <AvatarImage src={profile.avatarUrl} alt={displayName} /> : null}
        <AvatarFallback className="bg-[var(--gold)]/15 text-[var(--gold)] text-[10px] font-medium">
          {initials}
        </AvatarFallback>
      </Avatar>
    </header>
  );
}
