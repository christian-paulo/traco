'use client';

import { useState } from 'react';

import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';

import { Sidebar, type SidebarProfile } from './sidebar';
import { Topbar } from './topbar';

type DashboardShellProps = {
  profile: SidebarProfile;
  children: React.ReactNode;
};

export function DashboardShell({ profile, children }: DashboardShellProps) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <div className="bg-background flex min-h-dvh">
        <aside className="hidden w-[260px] shrink-0 border-r border-[var(--gold)]/20 lg:block">
          <Sidebar profile={profile} />
        </aside>

        <SheetContent side="left" className="bg-ink w-[280px] border-r border-[var(--gold)]/20 p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>Menu</SheetTitle>
          </SheetHeader>
          <Sidebar profile={profile} onNavigate={() => setOpen(false)} />
        </SheetContent>

        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar profile={profile} />
          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-10">{children}</main>
        </div>
      </div>
    </Sheet>
  );
}
