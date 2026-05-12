import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { StepHours } from '@/components/onboarding/steps/step-hours';
import { StepMessages } from '@/components/onboarding/steps/step-messages';
import { StepProcedures } from '@/components/onboarding/steps/step-procedures';
import { StepStudio } from '@/components/onboarding/steps/step-studio';
import { StepYou } from '@/components/onboarding/steps/step-you';
import { WizardStepper } from '@/components/onboarding/wizard-stepper';
import { listMessageTemplates } from '@/lib/queries/message-templates';
import { listProcedures } from '@/lib/queries/procedures';
import { getCurrentProfile } from '@/lib/queries/profile';
import {
  getCurrentProfessional,
  getCurrentStudio,
  listWorkingHours,
} from '@/lib/queries/studio';
import { isOnboardingStep, type OnboardingStep } from '@/lib/onboarding/steps';
import { createClient } from '@/lib/supabase/server';

export default async function OnboardingPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect('/login');

  const supabase = await createClient();
  const headerList = await headers();

  const { data: profileRow } = await supabase
    .from('profiles')
    .select('full_name, phone, avatar_url, onboarding_completed_at, onboarding_step')
    .eq('id', profile.id)
    .maybeSingle();

  if (profileRow?.onboarding_completed_at) {
    redirect('/dashboard');
  }

  const stepFromDb = profileRow?.onboarding_step ?? 'you';
  const currentStep: OnboardingStep = isOnboardingStep(stepFromDb) ? stepFromDb : 'you';

  const publicBaseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    (headerList.get('host') ? `https://${headerList.get('host')}` : 'http://localhost:3000');

  // Carregamento condicional por step pra reduzir trabalho
  let stepNode: React.ReactNode = null;

  if (currentStep === 'you') {
    stepNode = (
      <StepYou
        initial={{
          full_name: profileRow?.full_name ?? '',
          phone: profileRow?.phone ?? '',
          avatar_url: profileRow?.avatar_url ?? '',
        }}
      />
    );
  } else if (currentStep === 'studio') {
    const studio = await getCurrentStudio();
    stepNode = (
      <StepStudio
        initial={{
          name: studio?.name ?? '',
          slug: studio?.slug ?? '',
          address: studio?.address ?? '',
          bio: studio?.bio ?? '',
          cover_image_url: studio?.cover_image_url ?? '',
        }}
        designerFullName={profileRow?.full_name ?? ''}
        publicBaseUrl={publicBaseUrl}
      />
    );
  } else if (currentStep === 'procedures') {
    const procedures = await listProcedures(true);
    stepNode = <StepProcedures procedures={procedures} />;
  } else if (currentStep === 'hours') {
    const professional = await getCurrentProfessional();
    const hours = professional ? await listWorkingHours(professional.id) : [];
    stepNode = (
      <StepHours
        initial={hours.map((h) => ({
          day_of_week: h.day_of_week,
          start_time: h.start_time,
          end_time: h.end_time,
          is_active: h.is_active,
        }))}
      />
    );
  } else if (currentStep === 'messages') {
    const templates = await listMessageTemplates();
    stepNode = <StepMessages templates={templates} />;
  }

  return (
    <div className="flex min-h-dvh flex-col md:flex-row">
      <WizardStepper currentStep={currentStep} />
      <main className="flex flex-1 flex-col bg-background">{stepNode}</main>
    </div>
  );
}
