import { redirect } from 'next/navigation';

import { DashboardShell } from '@/components/shared/dashboard-shell';
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

  return (
    <DashboardShell
      profile={{
        fullName: profile.fullName,
        email: profile.email,
        avatarUrl: profile.avatarUrl,
      }}
    >
      {children}
    </DashboardShell>
  );
}
