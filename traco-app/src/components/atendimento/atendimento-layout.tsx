'use client';

import { useEffect, useMemo, useState } from 'react';

import type {
  AppointmentProcedureRow,
  FavoriteProductRow,
} from '@/lib/queries/appointment-procedures';
import type { CriticalAlert } from '@/lib/anamnesis/critical-answers';
import type { PhotoWithUrl } from '@/lib/queries/photos';
import type { ProcedureRow } from '@/lib/queries/procedures';
import type { NoteRow } from '@/lib/queries/professional-notes';
import type { ReactionRow } from '@/lib/queries/reactions';

import { AtendimentoHeader } from './atendimento-header';
import { AtendimentoTabs, type TabKey } from './atendimento-tabs';
import { FinalizarDialog } from './finalizar-dialog';
import { QuickAddButton } from './quick-add-button';
import { NoteFormDialog } from './tabs/note-form-dialog';
import { ReactionFormDialog } from './tabs/reaction-form-dialog';
import { TabFicha } from './tabs/tab-ficha';
import { TabFotos } from './tabs/tab-fotos';
import { TabHistorico } from './tabs/tab-historico';
import { TabNotas } from './tabs/tab-notas';
import { TabProcedimento } from './tabs/tab-procedimento';
import { TabReacoes } from './tabs/tab-reacoes';
import { TabResumo } from './tabs/tab-resumo';

const FULLSCREEN_KEY = 'traco_atendimento_fullscreen';

export type AppointmentLite = {
  id: string;
  client_id: string;
  procedure_id: string;
  scheduled_start_at: string | null;
  performed_at: string;
  price: number;
  status: string;
  notes: string | null;
  notes_internal: string | null;
  return_due_date: string | null;
  procedure_name: string | null;
  procedure_color: string | null;
};

export type ClientLite = {
  id: string;
  full_name: string;
  phone: string;
  email: string | null;
  birth_date: string | null;
  skin_phototype: string | null;
};

export type FichaState = {
  formId: string | null;
  currentAnswers: Record<string, unknown>;
  editCount: number;
  signedAt: string | null;
  templateFields: Array<Record<string, unknown>>;
};

export type PastAppointment = {
  id: string;
  performed_at: string;
  scheduled_start_at: string | null;
  price: number;
  status: string;
  procedure_name: string | null;
  procedure_color: string | null;
};

type Props = {
  appointment: AppointmentLite;
  client: ClientLite;
  ficha: FichaState;
  pastAppointments: PastAppointment[];
  criticalAlerts: CriticalAlert[];
  notes: NoteRow[];
  reactions: ReactionRow[];
  photos: PhotoWithUrl[];
  procedure: AppointmentProcedureRow | null;
  procedures: ProcedureRow[];
  favoriteProducts?: FavoriteProductRow[];
};

export function AtendimentoLayout(props: Props) {
  const [activeTab, setActiveTab] = useState<TabKey>('resumo');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fullscreenPreference, setFullscreenPreference] = useState(true);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [finalizeOpen, setFinalizeOpen] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [reactionOpen, setReactionOpen] = useState(false);

  // startTime: prefere scheduled_start_at, senão performed_at, senão agora
  const startTime = useMemo(() => {
    const ref =
      props.appointment.scheduled_start_at ??
      props.appointment.performed_at ??
      new Date().toISOString();
    return new Date(ref).getTime();
  }, [props.appointment.scheduled_start_at, props.appointment.performed_at]);

  // Cronômetro: usa Date.now() em cada tick — funciona em segundo plano
  useEffect(() => {
    function tick() {
      setElapsedSeconds(Math.max(0, Math.floor((Date.now() - startTime) / 1000)));
    }
    tick();
    const interval = window.setInterval(tick, 1000);
    return () => window.clearInterval(interval);
  }, [startTime]);

  // Carrega preferência de fullscreen do localStorage
  useEffect(() => {
    const stored = window.localStorage.getItem(FULLSCREEN_KEY);
    const pref = stored === null ? true : stored === '1';
    setFullscreenPreference(pref);
  }, []);

  // Listener de mudanças de fullscreen do navegador
  useEffect(() => {
    function onChange() {
      setIsFullscreen(Boolean(document.fullscreenElement));
    }
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  function toggleFullscreen() {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {
        /* ignore */
      });
      window.localStorage.setItem(FULLSCREEN_KEY, '0');
      setFullscreenPreference(false);
    } else {
      document.documentElement.requestFullscreen().catch(() => {
        /* ignore */
      });
      window.localStorage.setItem(FULLSCREEN_KEY, '1');
      setFullscreenPreference(true);
    }
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <AtendimentoHeader
        clientName={props.client.full_name}
        procedureName={props.appointment.procedure_name ?? 'Procedimento'}
        scheduledStart={props.appointment.scheduled_start_at}
        elapsedSeconds={elapsedSeconds}
        isFullscreen={isFullscreen}
        onToggleFullscreen={toggleFullscreen}
        onFinalize={() => setFinalizeOpen(true)}
      />

      <AtendimentoTabs
        active={activeTab}
        onChange={setActiveTab}
        activeReactionCount={props.reactions.filter((r) => r.status === 'active').length}
        pinnedNoteCount={props.notes.filter((n) => n.pinned).length}
      />

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6">
        {activeTab === 'resumo' ? (
          <TabResumo
            client={props.client}
            criticalAlerts={props.criticalAlerts}
            ficha={props.ficha}
            pastAppointments={props.pastAppointments}
          />
        ) : null}
        {activeTab === 'ficha' ? <TabFicha ficha={props.ficha} /> : null}
        {activeTab === 'historico' ? (
          <TabHistorico pastAppointments={props.pastAppointments} />
        ) : null}
        {activeTab === 'procedimento' ? (
          <TabProcedimento
            appointmentId={props.appointment.id}
            initial={props.procedure}
            favoriteProducts={props.favoriteProducts ?? []}
          />
        ) : null}
        {activeTab === 'reacoes' ? (
          <TabReacoes
            clientId={props.client.id}
            appointmentId={props.appointment.id}
            reactions={props.reactions}
          />
        ) : null}
        {activeTab === 'fotos' ? (
          <TabFotos
            clientId={props.client.id}
            photos={props.photos}
            procedures={props.procedures}
            currentAppointmentDate={props.appointment.performed_at}
          />
        ) : null}
        {activeTab === 'notas' ? (
          <TabNotas
            clientId={props.client.id}
            appointmentId={props.appointment.id}
            notes={props.notes}
          />
        ) : null}
      </main>

      <QuickAddButton
        onAddNote={() => setNoteOpen(true)}
        onAddReaction={() => setReactionOpen(true)}
        onAddPhoto={() => setActiveTab('fotos')}
      />

      <FinalizarDialog
        open={finalizeOpen}
        onOpenChange={setFinalizeOpen}
        appointmentId={props.appointment.id}
        clientName={props.client.full_name}
        procedureName={props.appointment.procedure_name ?? 'Procedimento'}
        elapsedSeconds={elapsedSeconds}
        defaultPrice={props.appointment.price}
        defaultReturnDate={props.appointment.return_due_date}
      />

      <NoteFormDialog
        open={noteOpen}
        onOpenChange={setNoteOpen}
        clientId={props.client.id}
        appointmentId={props.appointment.id}
      />

      <ReactionFormDialog
        open={reactionOpen}
        onOpenChange={setReactionOpen}
        clientId={props.client.id}
        appointmentId={props.appointment.id}
      />

      <span className="sr-only">{fullscreenPreference ? 'fs-on' : 'fs-off'}</span>
    </div>
  );
}
