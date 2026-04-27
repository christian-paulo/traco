'use client';

import { AlertTriangle, Loader2 } from 'lucide-react';
import { useTransition } from 'react';
import { toast } from 'sonner';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogBody,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { deleteAppointment } from '@/server/actions/appointments';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointmentId: string | null;
  onDeleted?: () => void;
};

export function DeleteAppointmentDialog({ open, onOpenChange, appointmentId, onDeleted }: Props) {
  const [isPending, startTransition] = useTransition();

  function handleConfirm() {
    if (!appointmentId) return;
    startTransition(async () => {
      const result = await deleteAppointment(appointmentId);
      if (result.success) {
        toast.success('Atendimento excluído.');
        onOpenChange(false);
        onDeleted?.();
      } else {
        toast.error(result.error || 'Não foi possível excluir.');
      }
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia>
            <AlertTriangle />
          </AlertDialogMedia>
          <div className="flex flex-col gap-1">
            <AlertDialogTitle>Excluir atendimento?</AlertDialogTitle>
          </div>
        </AlertDialogHeader>
        <AlertDialogBody>
          <AlertDialogDescription>
            Esta ação removerá o registro deste atendimento e o impacto no faturamento. Não pode ser
            desfeita.
          </AlertDialogDescription>
        </AlertDialogBody>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleConfirm();
            }}
            disabled={isPending}
          >
            {isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Excluindo...
              </>
            ) : (
              'Sim, excluir'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
