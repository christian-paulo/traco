import { CalendarPlus } from 'lucide-react';

import type { ProcedureRow } from '@/lib/queries/procedures';

import type { ClientLite } from './client-combobox';
import { NewAppointmentButton } from './new-appointment-button';

type Props = {
  clients: ClientLite[];
  procedures: ProcedureRow[];
  description?: string;
  defaultClientId?: string;
};

export function AppointmentsEmptyState({
  clients,
  procedures,
  description,
  defaultClientId,
}: Props) {
  return (
    <div className="flex flex-col items-center justify-center gap-5 px-6 py-16 text-center">
      <div className="flex size-20 items-center justify-center rounded-full bg-[var(--gold)]/10">
        <CalendarPlus className="size-10 text-[var(--gold)]" strokeWidth={1.25} />
      </div>
      <div className="flex flex-col gap-2">
        <p className="font-serif text-2xl italic text-foreground">
          Nenhum atendimento registrado ainda
        </p>
        {description ? (
          <p className="text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      <NewAppointmentButton
        clients={clients}
        procedures={procedures}
        defaultClientId={defaultClientId}
        label={defaultClientId ? 'Registrar primeiro atendimento' : 'Novo atendimento'}
      />
    </div>
  );
}
