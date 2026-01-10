import { createClient as createSupabaseClient } from "@supabase/supabase-js"

// Create Supabase client with Clerk session token for RLS
// Uses the new third-party auth integration (not the deprecated JWT template)
export function createClient(getToken?: () => Promise<string | null>) {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        fetch: async (url, options = {}) => {
          const headers = new Headers(options.headers)
          
          // If getToken is provided, add the Clerk session token
          if (getToken) {
            const token = await getToken()
            if (token) {
              headers.set("Authorization", `Bearer ${token}`)
            }
          }
          
          return fetch(url, { ...options, headers })
        },
      },
    }
  )
}
