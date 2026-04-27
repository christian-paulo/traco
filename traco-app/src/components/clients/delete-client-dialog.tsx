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
import { deleteClientRecord } from '@/server/actions/clients';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string | null;
  clientName?: string;
  onDeleted?: () => void;
};

export function DeleteClientDialog({ open, onOpenChange, clientId, clientName, onDeleted }: Props) {
  const [isPending, startTransition] = useTransition();

  function handleConfirm() {
    if (!clientId) return;
    startTransition(async () => {
      const result = await deleteClientRecord(clientId);
      if (result.success) {
        toast.success('Cliente excluída com sucesso.');
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
            <AlertDialogTitle>Excluir cliente?</AlertDialogTitle>
          </div>
        </AlertDialogHeader>
        <AlertDialogBody>
          <AlertDialogDescription>
            {clientName ? (
              <>
                Esta ação não pode ser desfeita. Todos os dados, fichas, atendimentos e fotos de{' '}
                <strong className="text-foreground">{clientName}</strong> serão removidos
                permanentemente.
              </>
            ) : (
              'Esta ação não pode ser desfeita. Todos os dados, fichas, atendimentos e fotos desta cliente serão removidos permanentemente.'
            )}
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
