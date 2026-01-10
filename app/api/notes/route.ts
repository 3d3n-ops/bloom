import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { createClient } from "@supabase/supabase-js"

// Create a Supabase client with service role key (bypasses RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET - Fetch notes for the authenticated user
export async function GET(req: NextRequest) {
  const { userId } = await auth()
  
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const folderId = searchParams.get("folderId")

  let query = supabaseAdmin
    .from("notes")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })

  if (folderId === "null") {
    query = query.is("folder_id", null)
  } else if (folderId) {
    query = query.eq("folder_id", folderId)
  }

  const { data, error } = await query

  if (error) {
    console.error("[API] Notes fetch error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data })
}

// POST - Create a new note
export async function POST(req: NextRequest) {
  const { userId } = await auth()
  
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()
  const { title, content, folder_id } = body

  const { data, error } = await supabaseAdmin
    .from("notes")
    .insert({
      title: title || "Untitled Note",
      content: content || "",
      folder_id: folder_id || null,
      user_id: userId,
    })
    .select()
    .single()

  if (error) {
    console.error("[API] Note create error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data })
}

