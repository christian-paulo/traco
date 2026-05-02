import { permanentRedirect } from 'next/navigation';

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function MetasRedirect({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const qs = new URLSearchParams();
  qs.set('tab', 'metas');
  for (const [k, v] of Object.entries(params)) {
    if (typeof v === 'string') qs.set(k, v);
  }
  permanentRedirect(`/dashboard/financeiro?${qs.toString()}`);
}
