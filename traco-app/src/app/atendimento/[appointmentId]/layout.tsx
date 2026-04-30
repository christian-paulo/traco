import { redirect } from 'next/navigation';

import { getCurrentProfile } from '@/lib/queries/profile';

/**
 * Layout fullscreen do Modo Atendimento.
 * Sem sidebar, sem topbar — só o filho com fundo cream.
 */
export default async function AtendimentoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getCurrentProfile();
  if (!profile) redirect('/login');

  return <div className="bg-cream min-h-dvh">{children}</div>;
}
