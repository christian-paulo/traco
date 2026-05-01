'use client';

import { Loader2, Megaphone } from 'lucide-react';
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
import { createAnnouncement } from '@/server/actions/academy';

type Props = {
  lessons: Array<{ id: string; title: string }>;
  onDone: () => void;
};

export function AnnouncementForm({ lessons, onDone }: Props) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [linkedLessonId, setLinkedLessonId] = useState<string>('');
  const [publishNow, setPublishNow] = useState(true);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const r = await createAnnouncement({
        title: title.trim(),
        content: content.trim(),
        linked_lesson_id: linkedLessonId || null,
        publish_now: publishNow,
      });
      if (r.success) {
        toast.success(publishNow ? 'Anúncio publicado.' : 'Anúncio salvo (rascunho).');
        setTitle('');
        setContent('');
        setLinkedLessonId('');
        setPublishNow(true);
        onDone();
      } else {
        toast.error(r.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs uppercase tracking-[0.16em]">Título</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs uppercase tracking-[0.16em]">Conteúdo</Label>
        <Textarea
          rows={4}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          maxLength={2000}
          required
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs uppercase tracking-[0.16em]">
          Aula vinculada (opcional)
        </Label>
        <Select
          value={linkedLessonId}
          onValueChange={(v) => setLinkedLessonId(v ?? '')}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Sem vínculo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Sem vínculo</SelectItem>
            {lessons.map((l) => (
              <SelectItem key={l.id} value={l.id}>
                {l.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <label className="flex items-center gap-3 rounded-md border border-cream-dark bg-cream/40 px-3 py-2.5">
        <Switch checked={publishNow} onCheckedChange={(v) => setPublishNow(Boolean(v))} />
        <span className="text-sm font-medium">Publicar agora</span>
      </label>
      <Button type="submit" variant="premium" disabled={pending} className="self-start">
        {pending ? <Loader2 className="size-4 animate-spin" /> : <Megaphone className="size-4" />}
        Criar anúncio
      </Button>
    </form>
  );
}
