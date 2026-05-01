import { ExternalLink, MessageCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

type Props = {
  url: string;
};

export function CommunityCard({ url }: Props) {
  return (
    <Card
      variant="premium"
      className="border-0 bg-gradient-to-br from-[var(--gold)]/15 to-ink ring-1 ring-[var(--gold)]/30"
    >
      <CardContent className="flex flex-col gap-3 px-6 py-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex size-12 items-center justify-center rounded-full bg-[var(--gold)]/20">
            <MessageCircle className="size-5 text-[var(--gold)]" />
          </div>
          <div className="flex flex-col gap-0.5">
            <p className="font-serif text-lg font-medium text-cream">
              Comunidade Founders Traço
            </p>
            <p className="text-xs text-cream/70">
              Grupo exclusivo das primeiras alunas. Pergunte, compartilhe, evolua junto.
            </p>
          </div>
        </div>
        <a href={url} target="_blank" rel="noopener noreferrer">
          <Button variant="premium" size="default">
            <ExternalLink className="size-4" />
            Entrar no grupo
          </Button>
        </a>
      </CardContent>
    </Card>
  );
}
