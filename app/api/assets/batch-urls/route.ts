import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

// GET /api/assets/batch-urls?datasetId=xxx — returns proxy URLs for all assets in a dataset
export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const datasetId = request.nextUrl.searchParams.get('datasetId')
  if (!datasetId) {
    return NextResponse.json({ error: 'datasetId query param is required' }, { status: 400 })
  }

  // Fetch all assets for designs in this dataset
  const { data: assets, error } = await supabase
    .from('assets')
    .select('design_id, asset_type, storage_path, designs!inner(design_key, dataset_id)')
    .eq('designs.dataset_id', datasetId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!assets || assets.length === 0) {
    return NextResponse.json({})
  }

  // Build assetMap keyed by design_key, using proxy URLs instead of signed URLs
  const assetMap: Record<string, { imageUrl: string | null; modelUrl: string | null }> = {}

  for (const asset of assets) {
    const designs = asset.designs as unknown as { design_key: string; dataset_id: string }
    const designKey = designs.design_key
    const proxyUrl = `/api/assets/file?path=${encodeURIComponent(asset.storage_path)}`

    if (!assetMap[designKey]) {
      assetMap[designKey] = { imageUrl: null, modelUrl: null }
    }

    if (asset.asset_type === 'image') {
      assetMap[designKey].imageUrl = proxyUrl
    } else if (asset.asset_type === 'model') {
      assetMap[designKey].modelUrl = proxyUrl
    }
  }

  return NextResponse.json(assetMap)
}
