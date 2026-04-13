import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { validateExtension, validateFileSize, validateMagicBytes } from '@/lib/file-validation'

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
    const category = (formData.get('category') as string | null) ?? 'default'

    if (!file || !datasetId || !designKey || !assetType) {
      return NextResponse.json(
        { error: 'file, datasetId, designKey, and assetType are required' },
        { status: 400 }
      )
    }

    if (assetType !== 'image' && assetType !== 'model') {
      return NextResponse.json({ error: 'assetType must be "image" or "model"' }, { status: 400 })
    }

    // Validate file extension
    const extResult = validateExtension(file.name)
    if (!extResult.valid) {
      return NextResponse.json({ error: extResult.error }, { status: 400 })
    }

    // Validate file size
    const sizeResult = validateFileSize(file.size)
    if (!sizeResult.valid) {
      return NextResponse.json({ error: sizeResult.error }, { status: 400 })
    }

    // Read file buffer (used for both validation and upload)
    const arrayBuffer = await file.arrayBuffer()

    // Validate file content matches declared extension
    const magicResult = validateMagicBytes(arrayBuffer, extResult.ext)
    if (!magicResult.valid) {
      return NextResponse.json({ error: magicResult.error }, { status: 400 })
    }

    // Look up or create the design row
    let designId: string

    if (designKey === '__context__') {
      // Context model: auto-create sentinel design row if it doesn't exist
      const { data: existing } = await supabase
        .from('designs')
        .select('id')
        .eq('dataset_id', datasetId)
        .eq('design_key', '__context__')
        .single()

      if (existing) {
        designId = existing.id
      } else {
        const { data: created, error: createError } = await supabase
          .from('designs')
          .insert({ dataset_id: datasetId, user_id: user.id, design_key: '__context__', params: {} })
          .select('id')
          .single()

        if (createError || !created) {
          return NextResponse.json(
            { error: `Failed to create context design record: ${createError?.message}` },
            { status: 500 }
          )
        }
        designId = created.id
      }
    } else {
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
      designId = design.id
    }

    // Upload to Supabase Storage
    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase()
    const safeDesignKey = designKey.replace(/[^a-zA-Z0-9_-]/g, '_')
    const safeCategory = category.replace(/[^a-zA-Z0-9_-]/g, '_')
    const storagePath = category !== 'default'
      ? `${user.id}/${datasetId}/${safeDesignKey}_${safeCategory}${ext}`
      : `${user.id}/${datasetId}/${safeDesignKey}${ext}`

    // Browsers often misreport MIME types for 3D model files — map explicitly
    const mimeOverrides: Record<string, string> = {
      '.glb': 'model/gltf-binary',
      '.gltf': 'model/gltf+json',
    }
    const contentType = mimeOverrides[ext] || file.type || 'application/octet-stream'

    const buffer = Buffer.from(arrayBuffer)

    const { error: uploadError } = await supabase.storage
      .from('design-assets')
      .upload(storagePath, buffer, {
        contentType,
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
          design_id: designId,
          user_id: user.id,
          asset_type: assetType,
          category,
          storage_path: storagePath,
          original_filename: file.name,
          mime_type: contentType,
          size_bytes: file.size,
        },
        { onConflict: 'design_id,asset_type,category' }
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
