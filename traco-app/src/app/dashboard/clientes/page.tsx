import type { Metadata } from 'next';

import { ClientsEmptyState } from '@/components/clients/clients-empty-state';
import { ClientsTable } from '@/components/clients/clients-table';
import { ClientsToolbar } from '@/components/clients/clients-toolbar';
import { NewClientButton } from '@/components/clients/new-client-button';
import { Card } from '@/components/ui/card';
import { listAllTags, listClients } from '@/lib/queries/clients';

export const metadata: Metadata = {
  title: 'Clientes | Traço',
};

type SearchParams = Promise<{ search?: string; tag?: string }>;

export default async function ClientesPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const search = params.search ?? '';
  const tag = params.tag ?? '';

  const [{ rows, total }, tags] = await Promise.all([
    listClients({ search, tag }),
    listAllTags(),
  ]);

  const hasFilters = search.length > 0 || tag.length > 0;
  const hasNoData = total === 0 && !hasFilters;

  return (
    <div className="flex flex-col gap-10">
      <header className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-2">
          <div className="h-px w-8 bg-[var(--gold)]" />
          <h1 className="font-serif text-4xl font-medium tracking-tight text-foreground">
            Clientes
          </h1>
          <p className="text-xs font-medium uppercase tracking-[0.3em] text-muted-foreground">
            Gerencie suas clientes
          </p>
        </div>
        {hasNoData ? null : <NewClientButton />}
      </header>

      {hasNoData ? (
        <Card variant="premium" className="bg-card border-0 ring-1 ring-[var(--border)] py-4">
          <ClientsEmptyState />
        </Card>
      ) : (
        <>
          <ClientsToolbar initialSearch={search} initialTag={tag} availableTags={tags} />
          <p className="text-xs text-muted-foreground">
            {total === 0
              ? 'Nenhuma cliente encontrada com esses filtros.'
              : `${total.toLocaleString('pt-BR')} ${total === 1 ? 'cliente cadastrada' : 'clientes cadastradas'}`}
          </p>
          <Card variant="premium" className="bg-card border-0 ring-1 ring-[var(--border)] overflow-hidden p-0">
            {rows.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <p className="font-serif text-lg italic text-muted-foreground">
                  Nenhum resultado.
                </p>
              </div>
            ) : (
              <ClientsTable clients={rows} />
            )}
          </Card>
        </>
      )}
    </div>
  );
}
