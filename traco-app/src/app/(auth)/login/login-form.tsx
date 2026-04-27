'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { signInWithMagicLink } from '@/server/actions/auth';

const formSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Informe seu email.')
    .email('Email inválido.'),
});

type FormValues = z.infer<typeof formSchema>;

export function LoginForm() {
  const [isPending, startTransition] = useTransition();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: '' },
  });

  function onSubmit(values: FormValues) {
    startTransition(async () => {
      const result = await signInWithMagicLink(values.email);
      if (result.success) {
        toast.success('Link enviado! Verifique seu email.');
        form.reset();
      } else {
        toast.error(result.error || 'Não foi possível enviar o link. Tente novamente.');
      }
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                Email
              </FormLabel>
              <FormControl>
                <Input
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="voce@exemplo.com"
                  disabled={isPending}
                  className="h-11 border-[var(--gold)]/30 bg-card focus-visible:border-[var(--gold)] focus-visible:ring-[var(--gold)]/30"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" variant="premium" size="xl" className="w-full" disabled={isPending}>
          {isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Enviando...
            </>
          ) : (
            'Enviar link mágico'
          )}
        </Button>
      </form>
    </Form>
  );
}
