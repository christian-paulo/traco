export const ONBOARDING_STEPS = [
  'you',
  'studio',
  'procedures',
  'hours',
  'messages',
] as const;

export type OnboardingStep = (typeof ONBOARDING_STEPS)[number];

export function isOnboardingStep(v: string): v is OnboardingStep {
  return (ONBOARDING_STEPS as readonly string[]).includes(v);
}
