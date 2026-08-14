import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

export function createSupabaseAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    console.error('createSupabaseAdminClient: variáveis de ambiente ausentes.');
    return null;
  }

  return createClient<Database>(url, serviceRoleKey);
}
