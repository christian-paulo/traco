import { permanentRedirect } from 'next/navigation';

export default function AdminAcademiaRedirect() {
  permanentRedirect('/dashboard/configuracoes?tab=admin');
}
