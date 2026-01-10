"use client"

import { useMemo } from "react"
import { useSession } from "@clerk/nextjs"
import { createClient } from "@/lib/supabase/client"

export function useSupabase() {
  const { session } = useSession()

  const supabase = useMemo(() => {
    return createClient(async () => {
      if (!session) {
        console.warn("[Supabase] No session available")
        return null
      }
      
      // Get the Supabase-specific JWT token from Clerk
      // This requires a "supabase" JWT template in Clerk dashboard
      const token = await session.getToken({ template: "supabase" })
      
      if (!token) {
        // Fallback to default token if supabase template doesn't exist
        console.warn("[Supabase] No supabase template token, using default")
        return await session.getToken()
      }
      
      return token
    })
  }, [session])

  return supabase
}
