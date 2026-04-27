'use client';

import { Plus } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import type { ProcedureRow } from '@/lib/queries/procedures';

import { AppointmentFormDialog } from './appointment-form-dialog';
import type { ClientLite } from './client-combobox';

type Props = {
  clients: ClientLite[];
  procedures: ProcedureRow[];
  defaultClientId?: string;
  variant?: 'premium' | 'outline-gold' | 'default';
  size?: 'default' | 'xl';
  className?: string;
  label?: string;
};

export function NewAppointmentButton({
  clients,
  procedures,
  defaultClientId,
  variant = 'premium',
  size = 'xl',
  className,
  label = 'Novo atendimento',
}: Props) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={className}
        onClick={() => setOpen(true)}
        disabled={procedures.length === 0}
      >
        <Plus className="size-4" />
        {label}
      </Button>
      <AppointmentFormDialog
        open={open}
        onOpenChange={setOpen}
        clients={clients}
        procedures={procedures}
        defaultClientId={defaultClientId}
      />
    </>
  );
}
