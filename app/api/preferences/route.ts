import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

// GET /api/preferences — fetch user preferences
export async function GET() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('user_preferences')
    .select('theme, default_project_id')
    .eq('user_id', user.id)
    .single()

  if (error && error.code === 'PGRST116') {
    // No row yet — return defaults
    return NextResponse.json({ theme: 'dark', default_project_id: null })
  }
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// PUT /api/preferences — upsert user preferences
export async function PUT(request: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { theme, default_project_id } = body as {
    theme?: 'light' | 'dark'
    default_project_id?: string | null
  }

  const updates: Record<string, unknown> = { user_id: user.id }
  if (theme) updates.theme = theme
  if (default_project_id !== undefined) updates.default_project_id = default_project_id

  const { error } = await supabase
    .from('user_preferences')
    .upsert(updates, { onConflict: 'user_id' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
