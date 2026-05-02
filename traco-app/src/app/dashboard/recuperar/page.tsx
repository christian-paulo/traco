import { permanentRedirect } from 'next/navigation';

export default function RecuperarRedirect() {
  permanentRedirect('/dashboard/clientes?filtro=recuperar');
}
