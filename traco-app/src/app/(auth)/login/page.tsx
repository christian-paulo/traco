import type { Metadata } from 'next';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { LoginForm } from './login-form';

export const metadata: Metadata = {
  title: 'Entrar | Traço',
};

export default function LoginPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 px-4 py-10">
      <div className="flex w-full max-w-sm flex-col items-center gap-8">
        <h1 className="text-5xl font-bold tracking-tight text-slate-900">Traço</h1>
        <Card className="w-full">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl">Entre com seu email</CardTitle>
            <CardDescription>Enviamos um link mágico para você acessar sua conta.</CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
