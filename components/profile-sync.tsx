"use client"

import { useEffect, useRef } from "react"
import { useUser } from "@clerk/nextjs"

export function ProfileSync() {
  const { user, isLoaded } = useUser()
  const hasSynced = useRef(false)

  useEffect(() => {
    // Only sync once per session when user is loaded
    if (isLoaded && user && !hasSynced.current) {
      hasSynced.current = true
      
      // Sync profile to Supabase
      fetch("/api/profile", { method: "POST" })
        .then((res) => res.json())
        .then((data) => {
          if (data.error) {
            console.error("[ProfileSync] Error:", data.error)
          } else {
            console.log("[ProfileSync] Synced:", data.data?.id)
          }
        })
        .catch((err) => {
          console.error("[ProfileSync] Failed:", err)
        })
    }
  }, [user, isLoaded])

  // This component doesn't render anything
  return null
}

