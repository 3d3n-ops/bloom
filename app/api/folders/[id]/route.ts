import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { createClient } from "@supabase/supabase-js"

// Create a Supabase client with service role key (bypasses RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface RouteParams {
  params: Promise<{ id: string }>
}

// DELETE - Delete a folder
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const { userId } = await auth()
  const { id } = await params
  
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { error } = await supabaseAdmin
    .from("folders")
    .delete()
    .eq("id", id)
    .eq("user_id", userId)

  if (error) {
    console.error("[API] Folder delete error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

