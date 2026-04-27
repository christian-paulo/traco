import { Card, CardContent } from '@/components/ui/card';

type PlaceholderSectionProps = {
  title: string;
  description: string;
};

export function PlaceholderSection({ title, description }: PlaceholderSectionProps) {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">{title}</h1>
        <p className="text-sm text-slate-500">{description}</p>
      </div>
      <Card>
        <CardContent className="py-12 text-center text-sm text-slate-500">
          Em construção. Disponível em breve.
        </CardContent>
      </Card>
    </div>
  );
}
