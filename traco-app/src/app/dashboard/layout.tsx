import { redirect } from 'next/navigation';

import { DashboardShell } from '@/components/shared/dashboard-shell';
import { countPendingDrafts } from '@/lib/queries/booking-drafts';
import { countOverdueReturns } from '@/lib/queries/clients-followup';
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

  const [pendingDrafts, overdueReturns] = await Promise.all([
    countPendingDrafts().catch(() => 0),
    countOverdueReturns().catch(() => 0),
  ]);

  return (
    <DashboardShell
      profile={{
        fullName: profile.fullName,
        email: profile.email,
        avatarUrl: profile.avatarUrl,
      }}
      badges={{ pendingDrafts, overdueReturns }}
    >
      {children}
    </DashboardShell>
  );
}
