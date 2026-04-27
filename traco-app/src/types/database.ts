/**
 * Stub temporário — substitua pelos types reais.
 *
 * Para regenerar:
 *   npx supabase login
 *   npx supabase gen types typescript --project-id blavbejxfqnookvboojq > src/types/database.ts
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: Record<
      string,
      { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> }
    >;
    Views: Record<string, { Row: Record<string, unknown> }>;
    Functions: Record<string, { Args: Record<string, unknown>; Returns: unknown }>;
    Enums: Record<string, string>;
    CompositeTypes: Record<string, Record<string, unknown>>;
  };
};
