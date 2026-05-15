import { createClient } from '@supabase/supabase-js';

// Vain server-side käyttöön (API-reitit). Ei ikinä clientille.
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);
