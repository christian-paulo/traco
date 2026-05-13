'use client';

import { useEffect } from 'react';
import { toast } from 'sonner';

const STORAGE_KEY = 'traco:last-welcome';

type Props = {
  firstName: string;
  overdueReturns: number;
  upcomingReturns: number;
  todayAppointments: number;
};

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function DailyWelcomeToast({
  firstName,
  overdueReturns,
  upcomingReturns,
  todayAppointments,
}: Props) {
  useEffect(() => {
    const today = todayKey();
    const last = window.localStorage.getItem(STORAGE_KEY);
    if (last === today) return;
    window.localStorage.setItem(STORAGE_KEY, today);

    // Monta mensagem com prioridades — atrasados primeiro, depois agenda, depois retornos
    const parts: string[] = [];
    if (overdueReturns > 0) {
      parts.push(
        `${overdueReturns} ${overdueReturns === 1 ? 'cliente atrasada' : 'clientes atrasadas'} de retorno`,
      );
    }
    if (todayAppointments > 0) {
      parts.push(
        `${todayAppointments} ${todayAppointments === 1 ? 'atendimento' : 'atendimentos'} hoje`,
      );
    }
    if (overdueReturns === 0 && upcomingReturns > 0) {
      parts.push(
        `${upcomingReturns} ${upcomingReturns === 1 ? 'cliente' : 'clientes'} pra contatar esta semana`,
      );
    }

    if (parts.length === 0) {
      toast(`Bom dia, ${firstName} 💛`, {
        description: 'Tudo em dia por aqui. Bom trabalho!',
        duration: 5000,
      });
      return;
    }

    toast(`Bom dia, ${firstName} 💛`, {
      description: parts.join(' · '),
      duration: 7000,
      action:
        overdueReturns > 0 || upcomingReturns > 0
          ? {
              label: 'Ver retornos',
              onClick: () => {
                window.location.href = '/dashboard/clientes?filtro=retornos';
              },
            }
          : undefined,
    });
  }, [firstName, overdueReturns, upcomingReturns, todayAppointments]);

  return null;
}
