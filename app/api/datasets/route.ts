import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { parseDesignData } from '@/lib/file-ingestion'

// POST /api/datasets — upload JSON, parse, insert dataset + designs
export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { projectId, jsonString, fileName } = body as {
    projectId: string
    jsonString: string
    fileName: string
  }

  if (!projectId || !jsonString) {
    return NextResponse.json({ error: 'projectId and jsonString are required' }, { status: 400 })
  }

  // Parse the design data
  let parsed
  try {
    parsed = parseDesignData(jsonString)
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed to parse JSON' },
      { status: 400 }
    )
  }

  // Insert dataset
  const { data: dataset, error: datasetError } = await supabase
    .from('datasets')
    .insert({
      project_id: projectId,
      user_id: user.id,
      name: fileName || 'data.json',
      columns_meta: parsed.columns,
      row_count: parsed.data.length,
    })
    .select('id')
    .single()

  if (datasetError) {
    return NextResponse.json({ error: datasetError.message }, { status: 500 })
  }

  // Bulk insert designs
  const designRows = parsed.data.map((design) => ({
    dataset_id: dataset.id,
    user_id: user.id,
    design_key: design.id,
    params: Object.fromEntries(
      Object.entries(design).filter(([key]) => key !== 'id')
    ),
  }))

  const { error: designsError } = await supabase
    .from('designs')
    .insert(designRows)

  if (designsError) {
    // Clean up the dataset if design insert fails
    await supabase.from('datasets').delete().eq('id', dataset.id)
    return NextResponse.json({ error: designsError.message }, { status: 500 })
  }

  return NextResponse.json({
    id: dataset.id,
    columns: parsed.columns,
    rowCount: parsed.data.length,
  }, { status: 201 })
}
