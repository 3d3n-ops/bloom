import { createClient as createSupabaseClient } from "@supabase/supabase-js"

// Create a simple Supabase client for server-side use
// Authentication is handled by Clerk, authorization is done at the application level
export function createClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
