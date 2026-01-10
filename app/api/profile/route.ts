import { NextResponse } from "next/server"
import { auth, currentUser } from "@clerk/nextjs/server"
import { createClient } from "@supabase/supabase-js"

// Create a Supabase client with service role key (bypasses RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET & POST - Sync user profile from Clerk to Supabase
export async function GET() {
  const { userId } = await auth()
  
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Get full user data from Clerk
  const user = await currentUser()
  
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  // Upsert the profile in Supabase
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .upsert({
      id: userId,
      email: user.emailAddresses[0]?.emailAddress || null,
      first_name: user.firstName || null,
      last_name: user.lastName || null,
      image_url: user.imageUrl || null,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: "id"
    })
    .select()
    .single()

  if (error) {
    console.error("[API] Profile sync error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data })
}

// POST is same as GET for this endpoint
export async function POST() {
  return GET()
}

