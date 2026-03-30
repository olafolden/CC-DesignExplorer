import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

// POST /api/assets/upload — upload a single asset file to Supabase Storage
// Expects multipart form data with: file, datasetId, designKey, assetType
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const datasetId = formData.get('datasetId') as string | null
    const designKey = formData.get('designKey') as string | null
    const assetType = formData.get('assetType') as string | null

    if (!file || !datasetId || !designKey || !assetType) {
      return NextResponse.json(
        { error: 'file, datasetId, designKey, and assetType are required' },
        { status: 400 }
      )
    }

    if (assetType !== 'image' && assetType !== 'model') {
      return NextResponse.json({ error: 'assetType must be "image" or "model"' }, { status: 400 })
    }

    // Look up the design row to get its ID
    const { data: design, error: designError } = await supabase
      .from('designs')
      .select('id')
      .eq('dataset_id', datasetId)
      .eq('design_key', designKey)
      .single()

    if (designError || !design) {
      return NextResponse.json(
        { error: `Design "${designKey}" not found in dataset` },
        { status: 404 }
      )
    }

    // Upload to Supabase Storage
    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase()
    const safeDesignKey = designKey.replace(/[^a-zA-Z0-9_-]/g, '_')
    const storagePath = `${user.id}/${datasetId}/${safeDesignKey}${ext}`

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const { error: uploadError } = await supabase.storage
      .from('design-assets')
      .upload(storagePath, buffer, {
        contentType: file.type || 'application/octet-stream',
        upsert: true,
      })

    if (uploadError) {
      return NextResponse.json(
        { error: `Storage upload failed: ${uploadError.message}`, path: storagePath },
        { status: 500 }
      )
    }

    // Upsert asset record in database
    const { error: assetError } = await supabase
      .from('assets')
      .upsert(
        {
          design_id: design.id,
          user_id: user.id,
          asset_type: assetType,
          storage_path: storagePath,
          original_filename: file.name,
          mime_type: file.type || 'application/octet-stream',
          size_bytes: file.size,
        },
        { onConflict: 'design_id,asset_type' }
      )

    if (assetError) {
      return NextResponse.json({ error: assetError.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true, storagePath }, { status: 201 })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
