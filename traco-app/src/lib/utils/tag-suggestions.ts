export const SUGGESTED_TAGS = [
  'VIP',
  'Brow Lamination',
  'Microblading',
  'Aniversariante',
  'Indicação',
  'Alérgica a henna',
  'Pele sensível',
] as const;

export function getSuggestedTags(currentTags: string[], query = ''): string[] {
  const normalized = query.trim().toLowerCase();
  const used = new Set(currentTags.map((t) => t.toLowerCase()));
  return SUGGESTED_TAGS.filter((t) => !used.has(t.toLowerCase())).filter((t) =>
    normalized ? t.toLowerCase().includes(normalized) : true,
  );
}
