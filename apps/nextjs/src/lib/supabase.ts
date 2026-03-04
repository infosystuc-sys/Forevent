import { createClient } from "@supabase/supabase-js";

import { env } from "~/env";

/**
 * Server-side Supabase client using the service role key.
 * Only use in server actions, API routes, and server components.
 * NEVER expose this client or its key to the browser.
 */
export const supabaseAdmin = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
);
