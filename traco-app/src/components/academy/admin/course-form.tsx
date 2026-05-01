'use client';

import { Loader2, Plus, Save } from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';
import {
  COURSE_PLANS,
  COURSE_PLAN_LABELS,
  type CoursePlan,
} from '@/lib/validations/academy';
import { createCourse, updateCourse } from '@/server/actions/academy';

export type EditableCourse = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  cover_image_url: string | null;
  sort_order: number;
  required_plan: CoursePlan;
  is_published: boolean;
};

type Props = {
  course?: EditableCourse | null;
  onDone: () => void;
};

export function CourseForm({ course, onDone }: Props) {
  const isEdit = Boolean(course);
  const [title, setTitle] = useState(course?.title ?? '');
  const [slug, setSlug] = useState(course?.slug ?? '');
  const [description, setDescription] = useState(course?.description ?? '');
  const [coverUrl, setCoverUrl] = useState(course?.cover_image_url ?? '');
  const [sortOrder, setSortOrder] = useState(String(course?.sort_order ?? 0));
  const [plan, setPlan] = useState<CoursePlan>(course?.required_plan ?? 'free');
  const [published, setPublished] = useState(course?.is_published ?? false);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      title: title.trim(),
      slug: slug.trim(),
      description: description.trim() || null,
      cover_image_url: coverUrl.trim() || null,
      sort_order: Number(sortOrder) || 0,
      required_plan: plan,
      is_published: published,
    };
    startTransition(async () => {
      const r =
        isEdit && course
          ? await updateCourse(course.id, payload)
          : await createCourse(payload);
      if (r.success) {
        toast.success(isEdit ? 'Curso atualizado.' : 'Curso criado.');
        onDone();
      } else {
        toast.error(r.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs uppercase tracking-[0.16em]">Título</Label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs uppercase tracking-[0.16em]">Slug</Label>
          <Input
            value={slug}
            onChange={(e) =>
              setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))
            }
            placeholder="bem-vinda-traco"
            required
          />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs uppercase tracking-[0.16em]">Descrição</Label>
        <Textarea
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={1000}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs uppercase tracking-[0.16em]">URL da capa</Label>
        <Input
          type="url"
          value={coverUrl}
          onChange={(e) => setCoverUrl(e.target.value)}
          placeholder="https://..."
        />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs uppercase tracking-[0.16em]">Ordem</Label>
          <Input
            type="number"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            min="0"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs uppercase tracking-[0.16em]">Plano</Label>
          <Select value={plan} onValueChange={(v) => setPlan((v ?? 'free') as CoursePlan)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {COURSE_PLANS.map((p) => (
                <SelectItem key={p} value={p}>
                  {COURSE_PLAN_LABELS[p]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <label className="flex items-center gap-3 self-end rounded-md border border-cream-dark bg-cream/40 px-3 py-2.5">
          <Switch checked={published} onCheckedChange={(v) => setPublished(Boolean(v))} />
          <span className="text-sm font-medium">Publicado</span>
        </label>
      </div>
      <Button type="submit" variant="premium" disabled={pending} className="self-start">
        {pending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : isEdit ? (
          <Save className="size-4" />
        ) : (
          <Plus className="size-4" />
        )}
        {isEdit ? 'Salvar' : 'Criar curso'}
      </Button>
    </form>
  );
}
