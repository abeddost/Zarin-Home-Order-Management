'use server'

import { getSupabaseServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

const PATH = '/admin420/show-room-orders/notes'

export async function createNote(title: string, content: string): Promise<{ id?: string; error?: string }> {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data, error } = await supabase
    .from('showroom_notes')
    .insert({ title: title || 'Untitled', content, created_by: user.id })
    .select('id')
    .single()

  if (error) return { error: error.message }
  revalidatePath(PATH)
  return { id: data.id }
}

export async function updateNote(id: string, title: string, content: string): Promise<{ error?: string }> {
  const supabase = await getSupabaseServerClient()
  const { error } = await supabase
    .from('showroom_notes')
    .update({ title: title || 'Untitled', content, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return { error: error.message }
  revalidatePath(PATH)
  return {}
}

export async function deleteNote(id: string): Promise<{ error?: string }> {
  const supabase = await getSupabaseServerClient()
  const { error } = await supabase.from('showroom_notes').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath(PATH)
  return {}
}
