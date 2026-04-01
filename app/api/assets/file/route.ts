import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

// GET /api/assets/file?path=<storage_path> — proxy a file from Supabase Storage
// This avoids exposing signed URLs to the client (Three.js chokes on long query strings)
export async function GET(request: NextRequest) {
  const storagePath = request.nextUrl.searchParams.get('path')
  if (!storagePath) {
    return NextResponse.json({ error: 'path query param is required' }, { status: 400 })
  }

  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Verify the path belongs to this user (path starts with user.id/)
  if (!storagePath.startsWith(`${user.id}/`)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data, error } = await supabase.storage
    .from('design-assets')
    .download(storagePath)

  if (error || !data) {
    return NextResponse.json({ error: error?.message || 'File not found' }, { status: 404 })
  }

  // Determine content type from extension
  const ext = storagePath.substring(storagePath.lastIndexOf('.')).toLowerCase()
  const mimeTypes: Record<string, string> = {
    '.glb': 'model/gltf-binary',
    '.gltf': 'model/gltf+json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
  }

  const arrayBuffer = await data.arrayBuffer()

  return new NextResponse(arrayBuffer, {
    headers: {
      'Content-Type': mimeTypes[ext] || 'application/octet-stream',
      'Cache-Control': 'private, max-age=3600',
    },
  })
}
