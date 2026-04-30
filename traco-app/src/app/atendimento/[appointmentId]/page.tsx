import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { AlertaInicialDialog } from '@/components/atendimento/alerta-inicial-dialog';
import { AtendimentoLayout } from '@/components/atendimento/atendimento-layout';
import { detectCriticalAlerts } from '@/lib/anamnesis/critical-answers';
import {
  getAppointmentProcedure,
  listFavoriteProducts,
} from '@/lib/queries/appointment-procedures';
import { getClientById } from '@/lib/queries/clients';
import { listPhotosByClient } from '@/lib/queries/photos';
import { listProcedures } from '@/lib/queries/procedures';
import { listClientNotes } from '@/lib/queries/professional-notes';
import { listClientReactions } from '@/lib/queries/reactions';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Atendimento em andamento',
  robots: { index: false, follow: false },
};

type Params = Promise<{ appointmentId: string }>;

export default async function AtendimentoPage({ params }: { params: Params }) {
  const { appointmentId } = await params;
  const supabase = await createClient();

  const { data: appointment } = await supabase
    .from('appointments')
    .select(
      'id, client_id, procedure_id, scheduled_start_at, performed_at, price, status, notes, notes_internal, return_due_date, procedures(id, name, color, default_return_days)',
    )
    .eq('id', appointmentId)
    .maybeSingle();

  if (!appointment) {
    redirect('/dashboard/agenda');
  }

  const client = await getClientById(appointment.client_id);
  if (!client) redirect('/dashboard/agenda');

  const [
    { data: pastAppointments },
    { data: anamnesisForm },
    notes,
    reactions,
    photos,
    procedure,
    procedures,
    favoriteProducts,
  ] = await Promise.all([
    supabase
      .from('appointments')
      .select(
        'id, performed_at, scheduled_start_at, price, status, procedures(id, name, color)',
      )
      .eq('client_id', appointment.client_id)
      .neq('id', appointmentId)
      .order('performed_at', { ascending: false })
      .limit(50),
    supabase
      .from('anamnesis_forms')
      .select(
        'id, status, signed_at, signature_png, signer_ip, integrity_hash, current_version_id, edit_count, answers, anamnesis_templates(name, fields), current_version:anamnesis_form_versions!current_version_id(answers)',
      )
      .eq('client_id', appointment.client_id)
      .eq('status', 'signed')
      .order('signed_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    listClientNotes(appointment.client_id),
    listClientReactions(appointment.client_id),
    listPhotosByClient(appointment.client_id),
    getAppointmentProcedure(appointmentId),
    listProcedures(true),
    listFavoriteProducts(),
  ]);

  // Resolve current_version answers (se existir) ou fallback pra answers do form
  let currentVersionAnswers: Record<string, unknown> | null = null;
  let templateFields: Array<Record<string, unknown>> = [];
  if (anamnesisForm) {
    const tpl = Array.isArray(anamnesisForm.anamnesis_templates)
      ? anamnesisForm.anamnesis_templates[0]
      : anamnesisForm.anamnesis_templates;
    if (tpl?.fields && Array.isArray(tpl.fields)) {
      templateFields = tpl.fields as Array<Record<string, unknown>>;
    }
    type RawVersion = { answers?: Record<string, unknown> | null };
    const verRaw = (anamnesisForm as { current_version?: RawVersion | RawVersion[] | null })
      .current_version;
    const ver = Array.isArray(verRaw) ? verRaw[0] : verRaw;
    if (ver?.answers && typeof ver.answers === 'object') {
      currentVersionAnswers = ver.answers as Record<string, unknown>;
    }
    if (!currentVersionAnswers && anamnesisForm.answers) {
      currentVersionAnswers = anamnesisForm.answers as Record<string, unknown>;
    }
  }

  const alerts = detectCriticalAlerts(currentVersionAnswers ?? {});

  type RawProc = { id?: string; name?: string; color?: string };
  const procRaw = appointment.procedures as RawProc | RawProc[] | null;
  const proc = Array.isArray(procRaw) ? procRaw[0] : procRaw;

  return (
    <>
      <AlertaInicialDialog
        appointmentId={appointmentId}
        clientName={client.full_name}
        reactions={reactions}
        criticalAlerts={alerts}
      />
      <AtendimentoLayout
      appointment={{
        id: appointment.id,
        client_id: appointment.client_id,
        procedure_id: appointment.procedure_id,
        scheduled_start_at: appointment.scheduled_start_at,
        performed_at: appointment.performed_at,
        price: Number(appointment.price ?? 0),
        status: appointment.status,
        notes: appointment.notes,
        notes_internal: appointment.notes_internal,
        return_due_date: appointment.return_due_date,
        procedure_name: proc?.name ?? null,
        procedure_color: proc?.color ?? null,
      }}
      client={{
        id: client.id,
        full_name: client.full_name,
        phone: client.phone,
        email: client.email,
        birth_date: client.birth_date,
        skin_phototype: client.skin_phototype,
      }}
      ficha={{
        formId: anamnesisForm?.id ?? null,
        currentAnswers: currentVersionAnswers ?? {},
        editCount: anamnesisForm?.edit_count ?? 0,
        signedAt: anamnesisForm?.signed_at ?? null,
        templateFields,
      }}
      pastAppointments={(pastAppointments ?? []).map((a) => {
        const p = a.procedures as RawProc | RawProc[] | null;
        const pp = Array.isArray(p) ? p[0] : p;
        return {
          id: a.id,
          performed_at: a.performed_at,
          scheduled_start_at: a.scheduled_start_at,
          price: Number(a.price ?? 0),
          status: a.status,
          procedure_name: pp?.name ?? null,
          procedure_color: pp?.color ?? null,
        };
      })}
      criticalAlerts={alerts}
      notes={notes}
      reactions={reactions}
      photos={photos}
      procedure={procedure}
      procedures={procedures}
      favoriteProducts={favoriteProducts}
    />
    </>
  );
}
