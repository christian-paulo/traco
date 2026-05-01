'use client';

import { MoreHorizontal, Paperclip, Pencil, RefreshCw, Trash2 } from 'lucide-react';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';

import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatCurrency, formatDate } from '@/lib/format';
import type { ExpenseRow } from '@/lib/queries/expenses';
import {
  EXPENSE_CATEGORY_COLORS,
  EXPENSE_CATEGORY_LABELS,
} from '@/lib/validations/expense';
import { deleteExpense } from '@/server/actions/expenses';

import {
  ExpenseFormDialog,
  type EditableExpense,
} from './expense-form-dialog';

type Props = {
  expenses: ExpenseRow[];
};

export function ExpensesTable({ expenses }: Props) {
  const [editing, setEditing] = useState<EditableExpense | null>(null);
  const [deleting, setDeleting] = useState<ExpenseRow | null>(null);
  const [, startTransition] = useTransition();

  function handleEdit(row: ExpenseRow) {
    setEditing({
      id: row.id,
      category: row.category,
      description: row.description,
      amount: row.amount,
      date: row.date,
      is_recurring: row.is_recurring,
      recurrence_pattern: row.recurrence_pattern,
      receipt_url: row.receipt_url,
      notes: row.notes,
      linked_product_id: row.linked_product_id,
    });
  }

  async function handleConfirmDelete() {
    if (!deleting) return;
    const id = deleting.id;
    return new Promise<void>((resolve, reject) => {
      startTransition(async () => {
        const result = await deleteExpense(id);
        if (result.success) {
          toast.success('Despesa removida.');
          setDeleting(null);
          resolve();
        } else {
          reject(new Error(result.error || 'Erro ao remover.'));
        }
      });
    });
  }

  if (expenses.length === 0) {
    return (
      <div className="rounded-xl border border-cream-dark bg-card p-10 text-center">
        <p className="font-serif text-lg italic text-muted-foreground">
          Nenhuma despesa registrada no período.
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Use “Nova despesa” pra começar a registrar saídas.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-cream-dark bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-28">Data</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead className="w-16 text-center">Recorrente</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {expenses.map((row) => {
              const color =
                EXPENSE_CATEGORY_COLORS[row.category] ?? '#6B7280';
              return (
                <TableRow
                  key={row.id}
                  className="cursor-pointer transition-colors hover:bg-cream-dark/30"
                  onClick={() => handleEdit(row)}
                >
                  <TableCell className="font-mono text-xs text-foreground">
                    {formatDate(row.date, 'short')}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className="text-[10px] uppercase tracking-[0.1em]"
                      style={{
                        borderColor: `${color}66`,
                        backgroundColor: `${color}1A`,
                        color,
                      }}
                    >
                      {EXPENSE_CATEGORY_LABELS[row.category]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-foreground">
                    <div className="flex items-center gap-2">
                      <span className="truncate">{row.description}</span>
                      {row.receipt_url ? (
                        <Paperclip className="size-3 text-muted-foreground" />
                      ) : null}
                    </div>
                    {row.notes ? (
                      <p className="text-[10px] text-muted-foreground line-clamp-1">
                        {row.notes}
                      </p>
                    ) : null}
                  </TableCell>
                  <TableCell className="text-right font-medium text-red-700">
                    {formatCurrency(row.amount)}
                  </TableCell>
                  <TableCell className="text-center">
                    {row.is_recurring ? (
                      <RefreshCw
                        className="mx-auto size-3.5 text-[var(--gold)]"
                        aria-label="Recorrente"
                      />
                    ) : null}
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Ações"
                            className="size-8"
                          >
                            <MoreHorizontal className="size-4" />
                          </Button>
                        }
                      />
                      <DropdownMenuContent align="end" className="w-44">
                        <DropdownMenuItem onClick={() => handleEdit(row)}>
                          <Pencil className="size-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => setDeleting(row)}
                        >
                          <Trash2 className="size-4" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <ExpenseFormDialog
        open={editing !== null}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
        expense={editing}
      />

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
        title="Excluir despesa?"
        description={`A despesa "${deleting?.description ?? ''}" será removida permanentemente.`}
        confirmLabel="Excluir"
        icon={Trash2}
        onConfirm={handleConfirmDelete}
      />
    </>
  );
}
