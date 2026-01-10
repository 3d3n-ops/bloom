import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { createClient } from "@supabase/supabase-js"

// Create a Supabase client with service role key (bypasses RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET - Fetch folders for the authenticated user
export async function GET() {
  const { userId } = await auth()
  
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data, error } = await supabaseAdmin
    .from("folders")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("[API] Folders fetch error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data })
}

// POST - Create a new folder
export async function POST(req: NextRequest) {
  const authResult = await auth()
  const userId = authResult?.userId
  
  console.log("[API] Folder create - auth result:", { userId, hasAuth: !!authResult })
  
  if (!userId) {
    console.error("[API] Folder create - No userId found")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()
  const { name } = body

  if (!name) {
    return NextResponse.json({ error: "Folder name is required" }, { status: 400 })
  }

  console.log("[API] Creating folder:", { name, user_id: userId })

  const { data, error } = await supabaseAdmin
    .from("folders")
    .insert({
      name,
      user_id: userId,
    })
    .select()
    .single()

  if (error) {
    console.error("[API] Folder create error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  console.log("[API] Folder created:", data)
  return NextResponse.json({ data })
}

