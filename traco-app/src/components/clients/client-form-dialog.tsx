'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useEffect, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { formatPhoneBR } from '@/lib/utils/phone';
import {
  PHOTOTYPES,
  PHOTOTYPE_LABELS,
  clientFormSchema,
  type ClientFormInput,
  type Phototype,
} from '@/lib/validations/client';
import { createClientRecord, updateClientRecord } from '@/server/actions/clients';

import { TagInput } from './tag-input';

export type EditableClient = {
  id: string;
  full_name: string;
  phone: string;
  email: string | null;
  birth_date: string | null;
  skin_phototype: string | null;
  notes: string | null;
  tags: string[];
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client?: EditableClient | null;
  onSaved?: (id: string) => void;
};

const EMPTY: ClientFormInput = {
  full_name: '',
  phone: '',
  email: '',
  birth_date: '',
  skin_phototype: null,
  notes: '',
  tags: [],
};

function toFormValues(client?: EditableClient | null): ClientFormInput {
  if (!client) return EMPTY;
  const phototype = (PHOTOTYPES as readonly string[]).includes(client.skin_phototype ?? '')
    ? (client.skin_phototype as Phototype)
    : null;
  return {
    full_name: client.full_name,
    phone: client.phone,
    email: client.email ?? '',
    birth_date: client.birth_date ?? '',
    skin_phototype: phototype,
    notes: client.notes ?? '',
    tags: client.tags ?? [],
  };
}

export function ClientFormDialog({ open, onOpenChange, client, onSaved }: Props) {
  const [isPending, startTransition] = useTransition();
  const isEdit = Boolean(client);

  const form = useForm<ClientFormInput>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: toFormValues(client),
  });

  useEffect(() => {
    if (open) form.reset(toFormValues(client));
  }, [open, client, form]);

  function onSubmit(values: ClientFormInput) {
    startTransition(async () => {
      if (isEdit && client) {
        const result = await updateClientRecord(client.id, values);
        if (result.success) {
          toast.success('Cliente atualizada com sucesso.');
          onOpenChange(false);
          onSaved?.(client.id);
        } else {
          toast.error(result.error || 'Não foi possível salvar.');
        }
      } else {
        const result = await createClientRecord(values);
        if (result.success) {
          toast.success('Cliente cadastrada com sucesso.');
          onOpenChange(false);
          onSaved?.(result.data.id);
        } else {
          toast.error(result.error || 'Não foi possível salvar.');
        }
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl font-medium tracking-tight">
            {isEdit ? 'Editar cliente' : 'Nova cliente'}
          </DialogTitle>
          <DialogDescription className="text-xs font-medium uppercase tracking-[0.3em]">
            {isEdit ? 'Atualize as informações' : 'Cadastre uma nova cliente'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4 pt-2">
            <FormField
              control={form.control}
              name="full_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome completo *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Maria da Silva"
                      autoComplete="name"
                      disabled={isPending}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>WhatsApp *</FormLabel>
                    <FormControl>
                      <Input
                        inputMode="tel"
                        autoComplete="tel"
                        placeholder="(11) 99999-9999"
                        disabled={isPending}
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(formatPhoneBR(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        inputMode="email"
                        autoComplete="email"
                        placeholder="maria@email.com"
                        disabled={isPending}
                        value={field.value ?? ''}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="birth_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de nascimento</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        disabled={isPending}
                        value={field.value ?? ''}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="skin_phototype"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fototipo de pele</FormLabel>
                    <FormControl>
                      <Select
                        value={field.value ?? ''}
                        onValueChange={(v) => field.onChange(v === '' ? null : (v as Phototype))}
                        disabled={isPending}
                      >
                        <SelectTrigger className="w-full h-10">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          {PHOTOTYPES.map((p) => (
                            <SelectItem key={p} value={p}>
                              {PHOTOTYPE_LABELS[p]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={4}
                      placeholder="Preferências, restrições, anotações..."
                      disabled={isPending}
                      value={field.value ?? ''}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tags</FormLabel>
                  <FormControl>
                    <TagInput
                      value={field.value ?? []}
                      onChange={field.onChange}
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
              >
                Cancelar
              </Button>
              <Button type="submit" variant="premium" size="xl" disabled={isPending}>
                {isPending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  'Salvar'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
