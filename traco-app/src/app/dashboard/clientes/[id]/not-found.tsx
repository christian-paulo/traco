import { UserX } from 'lucide-react';
import Link from 'next/link';

import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function ClientNotFound() {
  return (
    <Card variant="premium" className="bg-card border-0 ring-1 ring-[var(--border)] py-16">
      <CardContent className="flex flex-col items-center gap-5 text-center">
        <div className="flex size-20 items-center justify-center rounded-full bg-[var(--gold)]/10">
          <UserX className="size-10 text-[var(--gold)]" strokeWidth={1.25} />
        </div>
        <div className="flex flex-col gap-2">
          <p className="font-serif text-2xl italic text-foreground">Cliente não encontrada</p>
          <p className="text-sm text-muted-foreground">
            Talvez ela tenha sido removida ou o link esteja incorreto.
          </p>
        </div>
        <Link href="/dashboard/clientes" className={buttonVariants({ variant: 'premium', size: 'xl' })}>
          Voltar para clientes
        </Link>
      </CardContent>
    </Card>
  );
}
