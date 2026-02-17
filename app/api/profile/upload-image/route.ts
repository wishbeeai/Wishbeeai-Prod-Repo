import { NextRequest, NextResponse } from "next/server"
import { createClient, createAdminClient } from "@/lib/supabase/server"

const BUCKET = "avatars"
const MAX_SIZE = 2 * 1024 * 1024 // 2MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"]

export async function POST(req: NextRequest) {
  try {
    const authClient = await createClient()
    const {
      data: { user },
      error: authError,
    } = await authClient.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get("file") as File | null
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "Image must be smaller than 2MB" },
        { status: 400 }
      )
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Image must be JPEG, PNG, WebP, or GIF" },
        { status: 400 }
      )
    }

    const supabase = createAdminClient() ?? authClient
    const ext = file.name.split(".").pop() || "jpg"
    const path = `${user.id}/avatar.${ext}`

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, buffer, {
        contentType: file.type,
        upsert: true,
      })

    if (uploadError) {
      console.error("[profile/upload-image] Storage error:", uploadError)
      // If bucket doesn't exist, provide helpful error
      if (uploadError.message?.includes("Bucket not found") || uploadError.message?.includes("not found")) {
        return NextResponse.json(
          {
            error: "Storage not configured. Create an 'avatars' bucket in Supabase Storage (public) and add a policy to allow authenticated users to upload.",
          },
          { status: 502 }
        )
      }
      return NextResponse.json(
        { error: uploadError.message || "Upload failed" },
        { status: 500 }
      )
    }

    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path)
    const publicUrl = urlData.publicUrl

    return NextResponse.json({ url: publicUrl })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error("[profile/upload-image] Error:", msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
