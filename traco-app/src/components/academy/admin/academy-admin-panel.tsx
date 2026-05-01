'use client';

import { Pencil, Plus, Trash2, X } from 'lucide-react';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';

import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  COURSE_PLAN_LABELS,
  formatDuration,
  type CoursePlan,
  type LessonResource,
} from '@/lib/validations/academy';
import {
  deleteAnnouncement,
  deleteCourse,
  deleteLesson,
} from '@/server/actions/academy';

import {
  AnnouncementForm,
} from './announcement-form';
import { CourseForm, type EditableCourse } from './course-form';
import { LessonForm, type EditableLesson } from './lesson-form';

type AdminCourse = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  cover_image_url: string | null;
  sort_order: number;
  required_plan: CoursePlan;
  is_published: boolean;
};
type AdminLesson = {
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
type AdminAnnouncement = {
  id: string;
  title: string;
  content: string;
  linked_lesson_id: string | null;
  published_at: string | null;
  created_at: string;
};

type Props = {
  courses: AdminCourse[];
  lessons: AdminLesson[];
  announcements: AdminAnnouncement[];
};

export function AcademyAdminPanel({ courses, lessons, announcements }: Props) {
  const [editingCourse, setEditingCourse] = useState<EditableCourse | null>(null);
  const [creatingCourse, setCreatingCourse] = useState(false);
  const [confirmDeleteCourse, setConfirmDeleteCourse] = useState<AdminCourse | null>(null);

  const [editingLesson, setEditingLesson] = useState<EditableLesson | null>(null);
  const [creatingLesson, setCreatingLesson] = useState(false);
  const [confirmDeleteLesson, setConfirmDeleteLesson] = useState<AdminLesson | null>(null);

  const [creatingAnn, setCreatingAnn] = useState(false);
  const [confirmDeleteAnn, setConfirmDeleteAnn] = useState<AdminAnnouncement | null>(null);
  const [, startTransition] = useTransition();

  const courseTitleById = new Map(courses.map((c) => [c.id, c.title]));
  const lessonTitleById = new Map(lessons.map((l) => [l.id, l.title]));

  return (
    <Tabs defaultValue="cursos">
      <TabsList>
        <TabsTrigger value="cursos">Cursos</TabsTrigger>
        <TabsTrigger value="aulas">Aulas</TabsTrigger>
        <TabsTrigger value="anuncios">Anúncios</TabsTrigger>
      </TabsList>

      {/* CURSOS */}
      <TabsContent value="cursos" className="mt-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
            {courses.length} curso(s)
          </p>
          {!creatingCourse && !editingCourse ? (
            <Button variant="premium" size="sm" onClick={() => setCreatingCourse(true)}>
              <Plus className="size-4" />
              Novo curso
            </Button>
          ) : null}
        </div>

        {(creatingCourse || editingCourse) && (
          <Card variant="premium" className="bg-card border-0 ring-1 ring-[var(--gold)]/30">
            <CardContent className="flex flex-col gap-4 px-6 py-5">
              <div className="flex items-center justify-between">
                <p className="font-serif text-lg font-medium">
                  {editingCourse ? 'Editar curso' : 'Novo curso'}
                </p>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setCreatingCourse(false);
                    setEditingCourse(null);
                  }}
                >
                  <X className="size-4" />
                </Button>
              </div>
              <CourseForm
                course={editingCourse}
                onDone={() => {
                  setCreatingCourse(false);
                  setEditingCourse(null);
                }}
              />
            </CardContent>
          </Card>
        )}

        <ul className="flex flex-col gap-3">
          {courses.map((c) => (
            <li key={c.id}>
              <Card variant="premium" className="bg-card border-0 ring-1 ring-[var(--border)]">
                <CardContent className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                  <div className="flex flex-col gap-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-serif text-base font-medium">{c.title}</p>
                      <Badge
                        variant="outline"
                        className="text-[10px] uppercase tracking-[0.12em]"
                      >
                        {COURSE_PLAN_LABELS[c.required_plan]}
                      </Badge>
                      {c.is_published ? (
                        <Badge
                          variant="outline"
                          className="border-emerald-300 bg-emerald-50 text-[10px] uppercase tracking-[0.12em] text-emerald-800"
                        >
                          Publicado
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="border-muted text-[10px] uppercase tracking-[0.12em] text-muted-foreground"
                        >
                          Rascunho
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">/{c.slug}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        setEditingCourse({
                          id: c.id,
                          title: c.title,
                          slug: c.slug,
                          description: c.description,
                          cover_image_url: c.cover_image_url,
                          sort_order: c.sort_order,
                          required_plan: c.required_plan,
                          is_published: c.is_published,
                        })
                      }
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                      onClick={() => setConfirmDeleteCourse(c)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      </TabsContent>

      {/* AULAS */}
      <TabsContent value="aulas" className="mt-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
            {lessons.length} aula(s)
          </p>
          {!creatingLesson && !editingLesson ? (
            <Button
              variant="premium"
              size="sm"
              onClick={() => setCreatingLesson(true)}
              disabled={courses.length === 0}
            >
              <Plus className="size-4" />
              Nova aula
            </Button>
          ) : null}
        </div>

        {(creatingLesson || editingLesson) && (
          <Card variant="premium" className="bg-card border-0 ring-1 ring-[var(--gold)]/30">
            <CardContent className="flex flex-col gap-4 px-6 py-5">
              <div className="flex items-center justify-between">
                <p className="font-serif text-lg font-medium">
                  {editingLesson ? 'Editar aula' : 'Nova aula'}
                </p>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setCreatingLesson(false);
                    setEditingLesson(null);
                  }}
                >
                  <X className="size-4" />
                </Button>
              </div>
              <LessonForm
                courses={courses.map((c) => ({ id: c.id, title: c.title }))}
                lesson={editingLesson}
                onDone={() => {
                  setCreatingLesson(false);
                  setEditingLesson(null);
                }}
              />
            </CardContent>
          </Card>
        )}

        <ul className="flex flex-col gap-2">
          {lessons.map((l) => (
            <li key={l.id}>
              <Card variant="premium" className="bg-card border-0 ring-1 ring-[var(--border)]">
                <CardContent className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                      {courseTitleById.get(l.course_id) ?? l.course_id}
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-serif text-base font-medium">{l.title}</p>
                      {l.is_published ? (
                        <Badge
                          variant="outline"
                          className="border-emerald-300 bg-emerald-50 text-[10px] uppercase tracking-[0.12em] text-emerald-800"
                        >
                          Publicada
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="border-muted text-[10px] uppercase tracking-[0.12em] text-muted-foreground"
                        >
                          Rascunho
                        </Badge>
                      )}
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      {formatDuration(l.duration_seconds)}
                      {l.video_url ? ' · ' + l.video_url : ' · sem vídeo'}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        setEditingLesson({
                          id: l.id,
                          course_id: l.course_id,
                          title: l.title,
                          description: l.description,
                          video_url: l.video_url,
                          duration_seconds: l.duration_seconds,
                          sort_order: l.sort_order,
                          resources_urls: l.resources_urls,
                          is_published: l.is_published,
                        })
                      }
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                      onClick={() => setConfirmDeleteLesson(l)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      </TabsContent>

      {/* ANÚNCIOS */}
      <TabsContent value="anuncios" className="mt-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
            {announcements.length} anúncio(s)
          </p>
          {!creatingAnn ? (
            <Button variant="premium" size="sm" onClick={() => setCreatingAnn(true)}>
              <Plus className="size-4" />
              Novo anúncio
            </Button>
          ) : null}
        </div>

        {creatingAnn ? (
          <Card variant="premium" className="bg-card border-0 ring-1 ring-[var(--gold)]/30">
            <CardContent className="flex flex-col gap-4 px-6 py-5">
              <div className="flex items-center justify-between">
                <p className="font-serif text-lg font-medium">Novo anúncio</p>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setCreatingAnn(false)}
                >
                  <X className="size-4" />
                </Button>
              </div>
              <AnnouncementForm
                lessons={lessons.map((l) => ({ id: l.id, title: l.title }))}
                onDone={() => setCreatingAnn(false)}
              />
            </CardContent>
          </Card>
        ) : null}

        <ul className="flex flex-col gap-2">
          {announcements.map((a) => (
            <li key={a.id}>
              <Card variant="premium" className="bg-card border-0 ring-1 ring-[var(--border)]">
                <CardContent className="flex flex-wrap items-start justify-between gap-3 px-5 py-3">
                  <div className="flex min-w-0 flex-col gap-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-serif text-base font-medium">{a.title}</p>
                      {a.published_at ? (
                        <Badge
                          variant="outline"
                          className="border-emerald-300 bg-emerald-50 text-[10px] uppercase tracking-[0.12em] text-emerald-800"
                        >
                          Publicado
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="border-muted text-[10px] uppercase tracking-[0.12em] text-muted-foreground"
                        >
                          Rascunho
                        </Badge>
                      )}
                    </div>
                    {a.linked_lesson_id ? (
                      <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                        Vinculado:{' '}
                        {lessonTitleById.get(a.linked_lesson_id) ?? a.linked_lesson_id}
                      </p>
                    ) : null}
                    <p className="text-xs text-foreground/85 line-clamp-2">{a.content}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive"
                    onClick={() => setConfirmDeleteAnn(a)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      </TabsContent>

      <ConfirmDialog
        open={confirmDeleteCourse !== null}
        onOpenChange={(open) => {
          if (!open) setConfirmDeleteCourse(null);
        }}
        title="Excluir curso?"
        description={`O curso "${confirmDeleteCourse?.title}" e todas as aulas vinculadas serão removidos permanentemente.`}
        confirmLabel="Excluir"
        icon={Trash2}
        onConfirm={() =>
          new Promise<void>((resolve, reject) => {
            const id = confirmDeleteCourse?.id;
            if (!id) return resolve();
            startTransition(async () => {
              const r = await deleteCourse(id);
              if (r.success) {
                toast.success('Curso removido.');
                resolve();
              } else {
                reject(new Error(r.error));
              }
            });
          })
        }
      />

      <ConfirmDialog
        open={confirmDeleteLesson !== null}
        onOpenChange={(open) => {
          if (!open) setConfirmDeleteLesson(null);
        }}
        title="Excluir aula?"
        description={`A aula "${confirmDeleteLesson?.title}" será removida permanentemente. O progresso das alunas também será apagado.`}
        confirmLabel="Excluir"
        icon={Trash2}
        onConfirm={() =>
          new Promise<void>((resolve, reject) => {
            const id = confirmDeleteLesson?.id;
            if (!id) return resolve();
            startTransition(async () => {
              const r = await deleteLesson(id);
              if (r.success) {
                toast.success('Aula removida.');
                resolve();
              } else {
                reject(new Error(r.error));
              }
            });
          })
        }
      />

      <ConfirmDialog
        open={confirmDeleteAnn !== null}
        onOpenChange={(open) => {
          if (!open) setConfirmDeleteAnn(null);
        }}
        title="Excluir anúncio?"
        description={`"${confirmDeleteAnn?.title}" será removido permanentemente.`}
        confirmLabel="Excluir"
        icon={Trash2}
        onConfirm={() =>
          new Promise<void>((resolve, reject) => {
            const id = confirmDeleteAnn?.id;
            if (!id) return resolve();
            startTransition(async () => {
              const r = await deleteAnnouncement(id);
              if (r.success) {
                toast.success('Anúncio removido.');
                resolve();
              } else {
                reject(new Error(r.error));
              }
            });
          })
        }
      />
    </Tabs>
  );
}
