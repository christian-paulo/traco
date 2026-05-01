'use client';

import { Plus } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';

import { ExpenseFormDialog } from './expense-form-dialog';

export function NewExpenseButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="premium" size="xl" onClick={() => setOpen(true)}>
        <Plus className="size-4" />
        Nova despesa
      </Button>
      <ExpenseFormDialog open={open} onOpenChange={setOpen} expense={null} />
    </>
  );
}
