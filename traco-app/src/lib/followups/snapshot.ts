export type FollowupSnapshot = {
  contactedAt: string;
  channel: 'whatsapp' | 'sms' | 'phone' | 'in_person';
  outcome: 'pending' | 'scheduled' | 'declined' | 'no_response';
  resolvedAt: string | null;
};

export function isRecentlyContacted(
  followup: FollowupSnapshot | null,
  hours = 48,
): boolean {
  if (!followup || followup.outcome !== 'pending') return false;
  const contactedMs = new Date(followup.contactedAt).getTime();
  return Date.now() - contactedMs < hours * 3600 * 1000;
}
