import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { AcademyAdminPanel } from '@/components/academy/admin/academy-admin-panel';
import { isAdmin } from '@/lib/queries/academy';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Admin · Academia',
};

export default async function AcademiaAdminPage() {
  const allowed = await isAdmin();
  if (!allowed) redirect('/dashboard/academia');

  const supabase = await createClient();
  const [{ data: courses }, { data: lessons }, { data: announcements }] =
    await Promise.all([
      supabase.from('courses').select('*').order('sort_order', { ascending: true }),
      supabase
        .from('lessons')
        .select('*')
        .order('course_id', { ascending: true })
        .order('sort_order', { ascending: true }),
      supabase
        .from('course_announcements')
        .select('*')
        .order('created_at', { ascending: false }),
    ]);

  type AdminCourse = {
    id: string;
    title: string;
    slug: string;
    description: string | null;
    cover_image_url: string | null;
    sort_order: number;
    required_plan: 'free' | 'pro' | 'studio';
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
    resources_urls: Array<{ label: string; url: string }>;
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

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <div className="h-px w-8 bg-[var(--gold)]" />
        <h1 className="font-serif text-4xl font-medium tracking-tight text-foreground">
          Admin · Academia Traço
        </h1>
        <p className="text-xs font-medium uppercase tracking-[0.3em] text-muted-foreground">
          Cursos, aulas e anúncios — só você vê.
        </p>
      </header>

      <AcademyAdminPanel
        courses={(courses ?? []) as unknown as AdminCourse[]}
        lessons={
          ((lessons ?? []) as unknown as AdminLesson[]).map((l) => ({
            ...l,
            resources_urls: Array.isArray(l.resources_urls) ? l.resources_urls : [],
          }))
        }
        announcements={(announcements ?? []) as unknown as AdminAnnouncement[]}
      />
    </div>
  );
}
