'use client';

import { Eye, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
import { formatRelativeDate, getInitials } from '@/lib/format';
import type { ClientWithLastVisit } from '@/lib/queries/clients';

import {
  ClientFormDialog,
  type EditableClient,
} from './client-form-dialog';
import { DeleteClientDialog } from './delete-client-dialog';

type Props = {
  clients: ClientWithLastVisit[];
};

export function ClientsTable({ clients }: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState<EditableClient | null>(null);
  const [deleting, setDeleting] = useState<{ id: string; name: string } | null>(null);

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12" />
            <TableHead>Nome</TableHead>
            <TableHead>Telefone</TableHead>
            <TableHead>Última visita</TableHead>
            <TableHead>Tags</TableHead>
            <TableHead className="w-12" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {clients.map((client) => (
            <TableRow
              key={client.id}
              className="hover:bg-cream-dark/40 cursor-pointer transition-colors"
              onClick={() => router.push(`/dashboard/clientes/${client.id}`)}
            >
              <TableCell>
                <Avatar className="size-9 border border-[var(--gold)]/30">
                  <AvatarFallback className="bg-cream text-[var(--gold)] text-xs font-medium">
                    {getInitials(client.full_name)}
                  </AvatarFallback>
                </Avatar>
              </TableCell>
              <TableCell>
                <Link
                  href={`/dashboard/clientes/${client.id}`}
                  onClick={(e) => e.stopPropagation()}
                  className="font-medium text-foreground hover:text-[var(--gold)]"
                >
                  {client.full_name}
                </Link>
              </TableCell>
              <TableCell className="text-muted-foreground">{client.phone}</TableCell>
              <TableCell className="text-muted-foreground">
                {formatRelativeDate(client.last_visit_at)}
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {(client.tags ?? []).slice(0, 3).map((tag) => (
                    <Badge
                      key={tag}
                      variant="outline"
                      className="border-[var(--gold)]/40 bg-[var(--gold)]/10 text-foreground"
                    >
                      {tag}
                    </Badge>
                  ))}
                  {(client.tags?.length ?? 0) > 3 ? (
                    <Badge variant="outline" className="text-muted-foreground">
                      +{(client.tags?.length ?? 0) - 3}
                    </Badge>
                  ) : null}
                </div>
              </TableCell>
              <TableCell onClick={(e) => e.stopPropagation()}>
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Ações para ${client.full_name}`}
                        className="size-8"
                      >
                        <MoreHorizontal className="size-4" />
                      </Button>
                    }
                  />
                  <DropdownMenuContent align="end" className="w-44">
                    <DropdownMenuItem
                      onClick={() => router.push(`/dashboard/clientes/${client.id}`)}
                    >
                      <Eye className="size-4" />
                      Ver detalhes
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() =>
                        setEditing({
                          id: client.id,
                          full_name: client.full_name,
                          phone: client.phone,
                          email: client.email,
                          birth_date: client.birth_date,
                          skin_phototype: client.skin_phototype,
                          notes: client.notes,
                          tags: client.tags ?? [],
                        })
                      }
                    >
                      <Pencil className="size-4" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={() => setDeleting({ id: client.id, name: client.full_name })}
                    >
                      <Trash2 className="size-4" />
                      Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <ClientFormDialog
        open={editing !== null}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
        client={editing}
      />

      <DeleteClientDialog
        open={deleting !== null}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
        clientId={deleting?.id ?? null}
        clientName={deleting?.name}
      />
    </>
  );
}
