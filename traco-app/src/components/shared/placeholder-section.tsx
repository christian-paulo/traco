import { Sparkles } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';

type PlaceholderSectionProps = {
  title: string;
  description: string;
};

export function PlaceholderSection({ title, description }: PlaceholderSectionProps) {
  return (
    <div className="flex flex-col gap-10">
      <header className="flex flex-col gap-2">
        <div className="h-px w-8 bg-[var(--gold)]" />
        <h1 className="font-serif text-4xl font-medium tracking-tight text-foreground">{title}</h1>
        <p className="text-xs font-medium uppercase tracking-[0.3em] text-muted-foreground">
          {description}
        </p>
      </header>

      <Card variant="premium" className="bg-cream border-0 ring-1 ring-[var(--gold)]/15 py-12">
        <CardContent className="flex flex-col items-center justify-center gap-4 px-6 text-center">
          <Sparkles className="size-8 text-[var(--gold)]" strokeWidth={1.25} />
          <p className="font-serif text-xl italic text-muted-foreground">
            Em construção. Disponível em breve.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
