'use client';

import { Plus } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';

import { ClientFormDialog } from './client-form-dialog';

type Props = {
  variant?: 'premium' | 'outline-gold' | 'default';
  size?: 'default' | 'xl';
  className?: string;
  label?: string;
};

export function NewClientButton({
  variant = 'premium',
  size = 'xl',
  className,
  label = 'Nova cliente',
}: Props) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant={variant} size={size} className={className} onClick={() => setOpen(true)}>
        <Plus className="size-4" />
        {label}
      </Button>
      <ClientFormDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
