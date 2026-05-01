'use client';

import { Loader2, Plus, Save, Trash2 } from 'lucide-react';
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
import type { LessonResource } from '@/lib/validations/academy';
import { createLesson, updateLesson } from '@/server/actions/academy';

export type EditableLesson = {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  video_url: string | null;
  duration_seconds: number;
  sort_order: number;
  resources_urls: LessonResource[];
  is_published: boolean;
};

type Props = {
  courses: Array<{ id: string; title: string }>;
  lesson?: EditableLesson | null;
  defaultCourseId?: string;
  onDone: () => void;
};

export function LessonForm({ courses, lesson, defaultCourseId, onDone }: Props) {
  const isEdit = Boolean(lesson);
  const [courseId, setCourseId] = useState(
    lesson?.course_id ?? defaultCourseId ?? courses[0]?.id ?? '',
  );
  const [title, setTitle] = useState(lesson?.title ?? '');
  const [description, setDescription] = useState(lesson?.description ?? '');
  const [videoUrl, setVideoUrl] = useState(lesson?.video_url ?? '');
  const [duration, setDuration] = useState(String(lesson?.duration_seconds ?? 0));
  const [sortOrder, setSortOrder] = useState(String(lesson?.sort_order ?? 0));
  const [resources, setResources] = useState<LessonResource[]>(
    lesson?.resources_urls ?? [],
  );
  const [published, setPublished] = useState(lesson?.is_published ?? false);
  const [pending, startTransition] = useTransition();

  function addResource() {
    setResources((r) => [...r, { label: '', url: '' }]);
  }
  function updateResource(idx: number, patch: Partial<LessonResource>) {
    setResources((r) => r.map((res, i) => (i === idx ? { ...res, ...patch } : res)));
  }
  function removeResource(idx: number) {
    setResources((r) => r.filter((_, i) => i !== idx));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!courseId) {
      toast.error('Selecione um curso.');
      return;
    }
    const filteredResources = resources.filter(
      (r) => r.label.trim().length > 0 && r.url.trim().length > 0,
    );
    const payload = {
      course_id: courseId,
      title: title.trim(),
      description: description.trim() || null,
      video_url: videoUrl.trim() || null,
      duration_seconds: Number(duration) || 0,
      sort_order: Number(sortOrder) || 0,
      resources_urls: filteredResources,
      is_published: published,
    };
    startTransition(async () => {
      const r =
        isEdit && lesson
          ? await updateLesson(lesson.id, payload)
          : await createLesson(payload);
      if (r.success) {
        toast.success(isEdit ? 'Aula atualizada.' : 'Aula criada.');
        onDone();
      } else {
        toast.error(r.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs uppercase tracking-[0.16em]">Curso</Label>
        <Select value={courseId} onValueChange={(v) => setCourseId(v ?? '')}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Selecione um curso" />
          </SelectTrigger>
          <SelectContent>
            {courses.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs uppercase tracking-[0.16em]">Título</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs uppercase tracking-[0.16em]">Descrição</Label>
        <Textarea
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={2000}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs uppercase tracking-[0.16em]">URL do vídeo (Vimeo)</Label>
        <Input
          type="url"
          value={videoUrl}
          onChange={(e) => setVideoUrl(e.target.value)}
          placeholder="https://vimeo.com/..."
        />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs uppercase tracking-[0.16em]">Duração (seg)</Label>
          <Input
            type="number"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            min="0"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs uppercase tracking-[0.16em]">Ordem</Label>
          <Input
            type="number"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            min="0"
          />
        </div>
        <label className="flex items-center gap-3 self-end rounded-md border border-cream-dark bg-cream/40 px-3 py-2.5">
          <Switch checked={published} onCheckedChange={(v) => setPublished(Boolean(v))} />
          <span className="text-sm font-medium">Publicado</span>
        </label>
      </div>

      <div className="flex flex-col gap-2 rounded-md border border-cream-dark bg-cream/30 p-3">
        <div className="flex items-center justify-between">
          <Label className="text-xs uppercase tracking-[0.16em]">
            Recursos (PDFs, planilhas)
          </Label>
          <Button type="button" variant="ghost" size="sm" onClick={addResource}>
            <Plus className="size-3.5" />
            Adicionar
          </Button>
        </div>
        {resources.length === 0 ? (
          <p className="text-xs italic text-muted-foreground">
            Nenhum recurso. Use o botão acima.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {resources.map((r, idx) => (
              <div
                key={idx}
                className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_2fr_auto]"
              >
                <Input
                  value={r.label}
                  onChange={(e) => updateResource(idx, { label: e.target.value })}
                  placeholder="Rótulo"
                  className="h-9"
                />
                <Input
                  type="url"
                  value={r.url}
                  onChange={(e) => updateResource(idx, { url: e.target.value })}
                  placeholder="https://..."
                  className="h-9"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-9 text-destructive"
                  onClick={() => removeResource(idx)}
                  aria-label="Remover"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <Button type="submit" variant="premium" disabled={pending} className="self-start">
        {pending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : isEdit ? (
          <Save className="size-4" />
        ) : (
          <Plus className="size-4" />
        )}
        {isEdit ? 'Salvar' : 'Criar aula'}
      </Button>
    </form>
  );
}
