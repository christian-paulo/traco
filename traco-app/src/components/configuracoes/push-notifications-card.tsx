'use client';

import { Bell, BellOff, Loader2 } from 'lucide-react';
import { useEffect, useState, useTransition } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { subscribeToPush, unsubscribeFromPush } from '@/server/actions/push';

type Props = {
  vapidPublicKey: string | null;
  enabledOnThisDevice: boolean;
};

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const buffer = new ArrayBuffer(raw.length);
  const view = new Uint8Array(buffer);
  for (let i = 0; i < raw.length; i += 1) view[i] = raw.charCodeAt(i);
  return view as Uint8Array<ArrayBuffer>;
}

function detectDeviceLabel(): string {
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/i.test(ua)) return 'iPhone';
  if (/Android/i.test(ua)) return 'Android';
  if (/Mac/i.test(ua)) return 'Mac';
  if (/Windows/i.test(ua)) return 'Windows';
  return 'Navegador';
}

export function PushNotificationsCard({ vapidPublicKey, enabledOnThisDevice }: Props) {
  const [supported, setSupported] = useState<boolean | null>(null);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [enabled, setEnabled] = useState(enabledOnThisDevice);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const ok = 'serviceWorker' in navigator && 'PushManager' in window;
    setSupported(ok);
    if (ok && 'Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  async function enable() {
    if (!vapidPublicKey) {
      toast.error('Push não configurado (faltam VAPID keys no servidor).');
      return;
    }
    if (!supported) return;

    startTransition(async () => {
      try {
        // Permissão do browser
        const perm = await Notification.requestPermission();
        setPermission(perm);
        if (perm !== 'granted') {
          toast.error('Permissão negada pra notificações.');
          return;
        }

        // Registra service worker
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
        });
        await navigator.serviceWorker.ready;

        // Cria subscription
        const sub = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
        });

        const json = sub.toJSON();
        if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
          toast.error('Subscription incompleta.');
          return;
        }

        const result = await subscribeToPush({
          endpoint: json.endpoint,
          p256dh: json.keys.p256dh,
          authSecret: json.keys.auth,
          deviceLabel: detectDeviceLabel(),
        });

        if (result.success) {
          setEnabled(true);
          toast.success('Notificações ativadas neste dispositivo.');
        } else {
          toast.error(result.error || 'Erro ao salvar subscription.');
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Erro inesperado.');
      }
    });
  }

  async function disable() {
    startTransition(async () => {
      try {
        const registration = await navigator.serviceWorker.getRegistration('/');
        const sub = await registration?.pushManager.getSubscription();
        if (sub) {
          await unsubscribeFromPush(sub.endpoint);
          await sub.unsubscribe();
        }
        setEnabled(false);
        toast.success('Notificações desativadas neste dispositivo.');
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Erro ao desativar.');
      }
    });
  }

  if (supported === null) return null;

  if (!vapidPublicKey) {
    return (
      <div className="rounded-md bg-amber-50 px-3 py-2.5 text-xs text-amber-800 ring-1 ring-amber-200">
        Push notifications ainda não foram configuradas no servidor. Adicione as VAPID
        keys no .env pra ativar.
      </div>
    );
  }

  if (!supported) {
    return (
      <div className="rounded-md bg-cream/60 px-3 py-2.5 text-xs text-muted-foreground ring-1 ring-cream-dark">
        Este navegador não suporta push notifications. iPhone exige adicionar o app à tela
        inicial (Safari → Compartilhar → Adicionar à Tela de Início).
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-start gap-3 rounded-lg border border-cream-dark bg-card p-4">
        <div
          className={
            enabled
              ? 'flex size-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700'
              : 'flex size-10 shrink-0 items-center justify-center rounded-full bg-cream-dark/60 text-muted-foreground'
          }
        >
          {enabled ? (
            <Bell className="size-5" strokeWidth={1.75} />
          ) : (
            <BellOff className="size-5" strokeWidth={1.75} />
          )}
        </div>
        <div className="flex flex-1 flex-col gap-1">
          <p className="font-medium text-foreground">
            {enabled
              ? 'Notificações ativas neste dispositivo'
              : 'Receber lembretes deste navegador'}
          </p>
          <p className="text-xs text-muted-foreground">
            Você recebe alertas de clientes pra contatar, retornos atrasados e resumo
            diário às 7h.
          </p>
          {permission === 'denied' ? (
            <p className="mt-1 text-xs text-red-700">
              Permissão bloqueada nas configurações do navegador. Desbloqueie pra
              continuar.
            </p>
          ) : null}
        </div>
      </div>

      <div className="flex">
        {enabled ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={disable}
            disabled={pending}
          >
            {pending ? <Loader2 className="size-3.5 animate-spin" /> : <BellOff className="size-3.5" />}
            Desativar
          </Button>
        ) : (
          <Button
            type="button"
            variant="premium"
            size="sm"
            onClick={enable}
            disabled={pending || permission === 'denied'}
          >
            {pending ? <Loader2 className="size-3.5 animate-spin" /> : <Bell className="size-3.5" />}
            Ativar notificações
          </Button>
        )}
      </div>
    </div>
  );
}
