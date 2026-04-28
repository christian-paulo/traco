import type { NextRequest } from 'next/server';

import { updateSession } from '@/lib/supabase/middleware';

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Casa todas as rotas exceto:
     * - ficha pública (/ficha/[token])
     * - rotas internas do Next (_next/*, favicon, etc)
     * - assets estáticos
     */
    '/((?!ficha|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
