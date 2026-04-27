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
      <div className="flex min-h-dvh bg-slate-50">
        <aside className="hidden w-60 shrink-0 border-r border-slate-200 lg:block">
          <Sidebar profile={profile} />
        </aside>

        <SheetContent side="left" className="w-72 p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>Menu</SheetTitle>
          </SheetHeader>
          <Sidebar profile={profile} onNavigate={() => setOpen(false)} />
        </SheetContent>

        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar profile={profile} />
          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
        </div>
      </div>
    </Sheet>
  );
}
