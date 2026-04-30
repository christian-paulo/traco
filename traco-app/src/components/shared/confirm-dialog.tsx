'use client';

import { Loader2, type LucideIcon } from 'lucide-react';
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

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'destructive' | 'premium';
  icon?: LucideIcon;
  onConfirm: () => Promise<void> | void;
};

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'destructive',
  icon: Icon,
  onConfirm,
}: Props) {
  const [pending, startTransition] = useTransition();

  function handleConfirm() {
    startTransition(async () => {
      try {
        await onConfirm();
        onOpenChange(false);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Erro ao confirmar.');
      }
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          {Icon ? (
            <AlertDialogMedia>
              <Icon />
            </AlertDialogMedia>
          ) : null}
          <div className="flex flex-col gap-1">
            <AlertDialogTitle>{title}</AlertDialogTitle>
            <AlertDialogDescription>{description}</AlertDialogDescription>
          </div>
        </AlertDialogHeader>
        <AlertDialogBody className="hidden" />
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction variant={variant} onClick={handleConfirm} disabled={pending}>
            {pending ? <Loader2 className="size-4 animate-spin" /> : null}
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
