'use client';

import { Loader2, Save, ShieldCheck } from 'lucide-react';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  SHARING_TEMPLATES,
  SHARING_TEMPLATE_LABELS,
  type SharingTemplate,
} from '@/lib/validations/sharing';
import { updateSharingPreferences } from '@/server/actions/sharing';

type Props = {
  initial: {
    never_show_revenue: boolean;
    never_show_profit: boolean;
    never_show_expenses: boolean;
    default_template: SharingTemplate;
    watermark_enabled: boolean;
    custom_brand_color: string | null;
  };
};

export function PrivacyForm({ initial }: Props) {
  const [neverRevenue, setNeverRevenue] = useState(initial.never_show_revenue);
  const [neverProfit, setNeverProfit] = useState(initial.never_show_profit);
  const [neverExpenses, setNeverExpenses] = useState(initial.never_show_expenses);
  const [watermark, setWatermark] = useState(initial.watermark_enabled);
  const [template, setTemplate] = useState<SharingTemplate>(initial.default_template);
  const [color, setColor] = useState(initial.custom_brand_color ?? '#C9A961');
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const r = await updateSharingPreferences({
        never_show_revenue: neverRevenue,
        never_show_profit: neverProfit,
        never_show_expenses: neverExpenses,
        default_template: template,
        watermark_enabled: watermark,
        custom_brand_color: color,
      });
      if (r.success) toast.success('Preferências atualizadas.');
      else toast.error(r.error);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
        <ShieldCheck className="size-5 shrink-0 text-emerald-600" />
        <p className="text-xs leading-relaxed text-emerald-900">
          <strong>Padrão é privacidade.</strong> Receita, lucro e despesas começam
          bloqueados pra todos os relatórios compartilháveis. Você decide quando destravar.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Bloquear nos posts
        </p>

        <ToggleRow
          label="Nunca mostrar receita"
          description="O número de faturamento bruto fica fora de qualquer imagem gerada."
          checked={neverRevenue}
          onChange={setNeverRevenue}
        />
        <ToggleRow
          label="Nunca mostrar lucro"
          description="Lucro líquido e margem ficam ocultos."
          checked={neverProfit}
          onChange={setNeverProfit}
        />
        <ToggleRow
          label="Nunca mostrar despesas"
          description="Despesas detalhadas não aparecem em resumos compartilháveis."
          checked={neverExpenses}
          onChange={setNeverExpenses}
        />
      </div>

      <div className="flex flex-col gap-3">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Visual padrão
        </p>

        <ToggleRow
          label="Marca d'água Traço"
          description="Aparece sutil na base da imagem."
          checked={watermark}
          onChange={setWatermark}
        />

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs uppercase tracking-[0.16em]">Template padrão</Label>
            <Select
              value={template}
              onValueChange={(v) =>
                setTemplate((v ?? 'operational') as SharingTemplate)
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SHARING_TEMPLATES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {SHARING_TEMPLATE_LABELS[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-xs uppercase tracking-[0.16em]">
              Cor de destaque
            </Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="size-11 cursor-pointer rounded-md border border-cream-dark"
              />
              <Input
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="#C9A961"
                className="flex-1"
              />
            </div>
          </div>
        </div>

        <div
          className="flex items-center gap-3 rounded-lg p-4"
          style={{
            backgroundColor: `${color}1A`,
            borderLeft: `3px solid ${color}`,
          }}
        >
          <span
            className="font-serif text-sm font-medium"
            style={{ color }}
          >
            Preview
          </span>
          <span className="text-xs text-muted-foreground">
            Esta cor vai aparecer nos números e badges dos seus posts.
          </span>
        </div>
      </div>

      <Button type="submit" variant="premium" disabled={pending} className="self-start">
        {pending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
        Salvar preferências
      </Button>
    </form>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-md border border-cream-dark bg-card px-4 py-3 transition-colors hover:bg-cream-dark/30">
      <Switch checked={checked} onCheckedChange={(v) => onChange(Boolean(v))} />
      <div className="flex flex-col gap-0.5">
        <span className="text-sm font-medium text-foreground">{label}</span>
        <span className="text-xs text-muted-foreground">{description}</span>
      </div>
    </label>
  );
}
