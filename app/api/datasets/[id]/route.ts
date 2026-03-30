import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

// GET /api/datasets/[id] — fetch dataset metadata + all design rows
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Fetch dataset metadata
  const { data: dataset, error: datasetError } = await supabase
    .from('datasets')
    .select('id, name, columns_meta, row_count, project_id, created_at')
    .eq('id', id)
    .single()

  if (datasetError) {
    return NextResponse.json({ error: datasetError.message }, { status: 404 })
  }

  // Fetch all designs for this dataset
  const { data: designs, error: designsError } = await supabase
    .from('designs')
    .select('design_key, params')
    .eq('dataset_id', id)

  if (designsError) {
    return NextResponse.json({ error: designsError.message }, { status: 500 })
  }

  // Reconstruct DesignIteration[] from designs table
  const data = designs.map((d) => ({
    id: d.design_key,
    ...d.params as Record<string, unknown>,
  }))

  return NextResponse.json({
    id: dataset.id,
    name: dataset.name,
    projectId: dataset.project_id,
    columns: dataset.columns_meta,
    rowCount: dataset.row_count,
    data,
  })
}

// DELETE /api/datasets/[id] — delete dataset + cascade designs + assets
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { error } = await supabase
    .from('datasets')
    .delete()
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
