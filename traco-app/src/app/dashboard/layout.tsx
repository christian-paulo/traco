import { redirect } from 'next/navigation';

import { DashboardShell } from '@/components/shared/dashboard-shell';
import { countPendingDrafts } from '@/lib/queries/booking-drafts';
import { getCurrentProfile } from '@/lib/queries/profile';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getCurrentProfile();
  if (!profile) {
    redirect('/login');
  }

  let pendingDrafts = 0;
  try {
    pendingDrafts = await countPendingDrafts();
  } catch {
    // tabela pode ainda não existir se a migração não rodou — não bloqueia
  }

  return (
    <DashboardShell
      profile={{
        fullName: profile.fullName,
        email: profile.email,
        avatarUrl: profile.avatarUrl,
      }}
      badges={{ pendingDrafts }}
    >
      {children}
    </DashboardShell>
  );
}
