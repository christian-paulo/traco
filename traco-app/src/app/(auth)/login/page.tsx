import type { Metadata } from 'next';

import { LoginForm } from './login-form';

export const metadata: Metadata = {
  title: 'Entrar | Traço',
};

export default function LoginPage() {
  return (
    <main className="grid min-h-dvh grid-cols-1 md:grid-cols-2">
      {/* Mobile: header preto fino com logo */}
      <div className="bg-ink flex items-center justify-center border-b border-[var(--gold)]/20 px-4 py-6 md:hidden">
        <div className="flex flex-col items-center gap-1">
          <span className="font-serif text-3xl font-light tracking-wide text-[var(--gold)]">
            Traço
          </span>
          <span className="text-[10px] font-light uppercase tracking-[0.4em] text-white/60">
            by Master Brow
          </span>
        </div>
      </div>

      {/* Hero esquerda — visível apenas em md+ */}
      <aside className="bg-ink hidden flex-col items-center justify-center gap-12 px-12 py-16 md:flex">
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="font-serif text-7xl font-light tracking-wide text-[var(--gold)]">
            Traço
          </span>
          <span className="text-xs font-light uppercase tracking-[0.4em] text-white/60">
            by Master Brow
          </span>
          <div className="mt-6 h-px w-16 bg-[var(--gold)]" />
        </div>
        <p className="max-w-sm text-center font-serif text-lg italic leading-relaxed text-white/80">
          O sistema de gestão para designers de elite.
        </p>
      </aside>

      {/* Form direita */}
      <section className="bg-cream flex items-center justify-center px-4 py-12 sm:px-6 md:px-10">
        <div className="bg-card w-full max-w-md rounded-2xl border border-[var(--gold)]/20 p-8 shadow-sm sm:p-12">
          <div className="mb-8 flex flex-col gap-2">
            <div className="h-px w-8 bg-[var(--gold)]" />
            <h1 className="font-serif text-3xl font-medium tracking-tight text-foreground">
              Entrar
            </h1>
            <p className="text-xs font-medium uppercase tracking-[0.3em] text-muted-foreground">
              Acesse seu painel
            </p>
          </div>
          <LoginForm />
        </div>
      </section>
    </main>
  );
}
