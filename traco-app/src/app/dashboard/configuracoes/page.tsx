import type { Metadata } from 'next';

import { ProceduresList } from '@/components/configuracoes/procedures-list';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { listProcedures } from '@/lib/queries/procedures';

export const metadata: Metadata = {
  title: 'Configurações | Traço',
};

export default async function ConfiguracoesPage() {
  const procedures = await listProcedures(true);

  return (
    <div className="flex flex-col gap-10">
      <header className="flex flex-col gap-2">
        <div className="h-px w-8 bg-[var(--gold)]" />
        <h1 className="font-serif text-4xl font-medium tracking-tight text-foreground">
          Configurações
        </h1>
        <p className="text-xs font-medium uppercase tracking-[0.3em] text-muted-foreground">
          Personalize o que você oferece
        </p>
      </header>

      <Tabs defaultValue="procedimentos">
        <TabsList>
          <TabsTrigger value="procedimentos">Procedimentos</TabsTrigger>
          <TabsTrigger value="conta">Conta</TabsTrigger>
          <TabsTrigger value="personalizacao">Personalização</TabsTrigger>
        </TabsList>

        <TabsContent value="procedimentos" className="mt-6 flex flex-col gap-5">
          <div className="flex flex-col gap-1">
            <h2 className="font-serif text-2xl font-medium tracking-tight text-foreground">
              Catálogo de procedimentos
            </h2>
            <p className="text-sm text-muted-foreground">
              Configure os procedimentos que você oferece. Cor, valor padrão e dias para retorno.
            </p>
          </div>
          {procedures.length === 0 ? (
            <Card variant="premium" className="bg-card border-0 ring-1 ring-[var(--border)] py-12">
              <CardContent className="text-center">
                <p className="font-serif text-lg italic text-muted-foreground">
                  Nenhum procedimento cadastrado.
                </p>
              </CardContent>
            </Card>
          ) : (
            <ProceduresList procedures={procedures} />
          )}
        </TabsContent>

        <TabsContent value="conta" className="mt-6">
          <Card variant="premium" className="bg-card border-0 ring-1 ring-[var(--border)] py-12">
            <CardContent className="text-center">
              <p className="font-serif text-lg italic text-muted-foreground">
                Em breve. Nome, email e foto de perfil.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="personalizacao" className="mt-6">
          <Card variant="premium" className="bg-card border-0 ring-1 ring-[var(--border)] py-12">
            <CardContent className="text-center">
              <p className="font-serif text-lg italic text-muted-foreground">
                Em breve. Tema, marca e templates de comunicação.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
