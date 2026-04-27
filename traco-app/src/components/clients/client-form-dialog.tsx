'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useEffect, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Form, FormField } from '@/components/ui/form';
import { FormFieldPro } from '@/components/ui/form-field-pro';
import { FormSection } from '@/components/ui/form-section';
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar cliente' : 'Nova cliente'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Atualize as informações da cliente.'
              : 'Cadastre as informações principais.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <DialogBody>
              <FormSection title="Informações principais">
                <FormField
                  control={form.control}
                  name="full_name"
                  render={({ field }) => (
                    <FormFieldPro label="Nome completo" required>
                      <Input
                        placeholder="Maria da Silva"
                        autoComplete="name"
                        disabled={isPending}
                        {...field}
                      />
                    </FormFieldPro>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormFieldPro label="WhatsApp" required>
                      <Input
                        inputMode="tel"
                        autoComplete="tel"
                        placeholder="(11) 99999-9999"
                        disabled={isPending}
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(formatPhoneBR(e.target.value))}
                      />
                    </FormFieldPro>
                  )}
                />
              </FormSection>

              <FormSection title="Dados complementares">
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormFieldPro label="Email">
                        <Input
                          type="email"
                          inputMode="email"
                          autoComplete="email"
                          placeholder="maria@email.com"
                          disabled={isPending}
                          value={field.value ?? ''}
                          onChange={field.onChange}
                        />
                      </FormFieldPro>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="birth_date"
                    render={({ field }) => (
                      <FormFieldPro label="Data de nascimento">
                        <Input
                          type="date"
                          disabled={isPending}
                          value={field.value ?? ''}
                          onChange={field.onChange}
                        />
                      </FormFieldPro>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="skin_phototype"
                    render={({ field }) => (
                      <FormFieldPro
                        label="Fototipo de pele"
                        className="md:col-span-2"
                      >
                        <Select
                          value={field.value ?? ''}
                          onValueChange={(v) =>
                            field.onChange(!v ? null : (v as Phototype))
                          }
                          disabled={isPending}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue>
                              {(value: string | null) => {
                                if (!value) {
                                  return (
                                    <span className="text-muted-foreground/70">Selecione</span>
                                  );
                                }
                                return PHOTOTYPE_LABELS[value as Phototype] ?? value;
                              }}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {PHOTOTYPES.map((p) => (
                              <SelectItem key={p} value={p}>
                                {PHOTOTYPE_LABELS[p]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormFieldPro>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormFieldPro label="Observações" className="md:col-span-2">
                        <Textarea
                          rows={4}
                          placeholder="Preferências, restrições, anotações..."
                          disabled={isPending}
                          value={field.value ?? ''}
                          onChange={field.onChange}
                        />
                      </FormFieldPro>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="tags"
                    render={({ field }) => (
                      <FormFieldPro label="Tags" className="md:col-span-2">
                        <TagInput
                          value={field.value ?? []}
                          onChange={field.onChange}
                          disabled={isPending}
                        />
                      </FormFieldPro>
                    )}
                  />
                </div>
              </FormSection>
            </DialogBody>

            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
                size="default"
                className="h-10 sm:w-auto w-full"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="default"
                disabled={isPending}
                size="default"
                className="h-10 sm:w-auto w-full"
              >
                {isPending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Salvando...
                  </>
                ) : isEdit ? (
                  'Salvar alterações'
                ) : (
                  'Salvar cliente'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
