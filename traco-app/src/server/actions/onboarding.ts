'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import {
  ONBOARDING_STEPS,
  isOnboardingStep,
  type OnboardingStep,
} from '@/lib/onboarding/steps';
import { getCurrentProfile } from '@/lib/queries/profile';
import { createClient } from '@/lib/supabase/server';

type SimpleResult = { success: true } | { success: false; error: string };

export async function advanceOnboardingStep(
  current: OnboardingStep,
): Promise<SimpleResult> {
  const profile = await getCurrentProfile();
  if (!profile) return { success: false, error: 'Sessão expirada.' };

  const currentIndex = ONBOARDING_STEPS.indexOf(current);
  const next = ONBOARDING_STEPS[currentIndex + 1] ?? null;

  const supabase = await createClient();

  if (!next) {
    // último step → completa onboarding
    const { error } = await supabase
      .from('profiles')
      .update({
        onboarding_completed_at: new Date().toISOString(),
        onboarding_step: 'done',
      })
      .eq('id', profile.id);
    if (error) return { success: false, error: error.message };
    // Espelha flag em user_metadata pro middleware ler sem hit no DB
    await supabase.auth.updateUser({
      data: { onboarding_completed: true },
    });
    revalidatePath('/onboarding');
    revalidatePath('/dashboard');
    return { success: true };
  }

  const { error } = await supabase
    .from('profiles')
    .update({ onboarding_step: next })
    .eq('id', profile.id);
  if (error) return { success: false, error: error.message };

  revalidatePath('/onboarding');
  return { success: true };
}

export async function restartOnboarding(): Promise<SimpleResult> {
  const profile = await getCurrentProfile();
  if (!profile) return { success: false, error: 'Sessão expirada.' };

  const supabase = await createClient();
  const { error } = await supabase
    .from('profiles')
    .update({
      onboarding_completed_at: null,
      onboarding_step: 'you',
    })
    .eq('id', profile.id);

  if (error) return { success: false, error: error.message };
  // Limpa flag pro middleware redirecionar de novo
  await supabase.auth.updateUser({
    data: { onboarding_completed: false },
  });
  revalidatePath('/dashboard');
  revalidatePath('/onboarding');
  redirect('/onboarding');
}

export async function goBackOnboardingStep(
  current: OnboardingStep,
): Promise<SimpleResult> {
  const profile = await getCurrentProfile();
  if (!profile) return { success: false, error: 'Sessão expirada.' };

  const currentIndex = ONBOARDING_STEPS.indexOf(current);
  if (currentIndex <= 0) return { success: true };
  const prev = ONBOARDING_STEPS[currentIndex - 1];

  const supabase = await createClient();
  const { error } = await supabase
    .from('profiles')
    .update({ onboarding_step: prev })
    .eq('id', profile.id);
  if (error) return { success: false, error: error.message };
  revalidatePath('/onboarding');
  return { success: true };
}

export async function setOnboardingStep(step: string): Promise<SimpleResult> {
  if (!isOnboardingStep(step)) return { success: false, error: 'Passo inválido.' };
  const profile = await getCurrentProfile();
  if (!profile) return { success: false, error: 'Sessão expirada.' };

  const supabase = await createClient();
  const { error } = await supabase
    .from('profiles')
    .update({ onboarding_step: step })
    .eq('id', profile.id);
  if (error) return { success: false, error: error.message };

  revalidatePath('/onboarding');
  return { success: true };
}
