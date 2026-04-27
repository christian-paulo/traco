import type { ProcedureRow } from '@/lib/queries/procedures';

import { ProcedureCard } from './procedure-card';

type Props = {
  procedures: ProcedureRow[];
};

export function ProceduresList({ procedures }: Props) {
  return (
    <div className="flex flex-col gap-3">
      {procedures.map((p) => (
        <ProcedureCard key={p.id} procedure={p} />
      ))}
    </div>
  );
}
