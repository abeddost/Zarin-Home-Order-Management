'use client'

import { useCallback, useEffect, useRef, useState, useTransition } from 'react'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { createNote, updateNote, deleteNote } from '@/actions/showroomNotes'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Trash2, StickyNote, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { formatDate } from '@/lib/utils'
import type { ShowroomNote } from '@/types'

export default function ShowroomNotesPage() {
  const [notes, setNotes] = useState<ShowroomNote[]>([])
  const [loading, setLoading] = useState(true)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [isPending, startTransition] = useTransition()
  const [saving, setSaving] = useState(false)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchNotes = useCallback(async () => {
    const supabase = getSupabaseBrowserClient()
    const { data } = await supabase
      .from('showroom_notes')
      .select('id, title, content, created_by, created_at, updated_at')
      .order('updated_at', { ascending: false })
    setNotes((data ?? []) as ShowroomNote[])
    setLoading(false)
  }, [])

  useEffect(() => { fetchNotes() }, [fetchNotes])

  function openNote(note: ShowroomNote) {
    setActiveId(note.id)
    setTitle(note.title)
    setContent(note.content)
  }

  function handleNew() {
    startTransition(async () => {
      const result = await createNote('Untitled', '')
      if (result.error) { toast.error(result.error); return }
      await fetchNotes()
      // open the newly created note
      const supabase = getSupabaseBrowserClient()
      const { data } = await supabase
        .from('showroom_notes')
        .select('id, title, content, created_by, created_at, updated_at')
        .eq('id', result.id!)
        .single()
      if (data) openNote(data as ShowroomNote)
    })
  }

  function scheduleAutoSave(newTitle: string, newContent: string) {
    if (!activeId) return
    if (saveTimer.current) clearTimeout(saveTimer.current)
    setSaving(true)
    saveTimer.current = setTimeout(async () => {
      const result = await updateNote(activeId, newTitle, newContent)
      setSaving(false)
      if (result.error) { toast.error(result.error); return }
      setNotes(prev => prev.map(n =>
        n.id === activeId
          ? { ...n, title: newTitle || 'Untitled', content: newContent, updated_at: new Date().toISOString() }
          : n
      ).sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()))
    }, 800)
  }

  function handleTitleChange(val: string) {
    setTitle(val)
    scheduleAutoSave(val, content)
  }

  function handleContentChange(val: string) {
    setContent(val)
    scheduleAutoSave(title, val)
  }

  function handleDelete(note: ShowroomNote) {
    if (!confirm(`Delete note "${note.title}"?`)) return
    startTransition(async () => {
      const result = await deleteNote(note.id)
      if (result.error) { toast.error(result.error); return }
      toast.success('Note deleted')
      if (activeId === note.id) { setActiveId(null); setTitle(''); setContent('') }
      setNotes(prev => prev.filter(n => n.id !== note.id))
    })
  }

  const activeNote = notes.find(n => n.id === activeId)

  return (
    <div className="flex h-[calc(100vh-4rem)] lg:h-screen overflow-hidden">

      {/* Sidebar — notes list */}
      <div className="w-64 shrink-0 border-r border-stone-200 bg-white flex flex-col">
        <div className="px-4 py-4 border-b border-stone-100 flex items-center justify-between">
          <h1 className="text-base font-bold text-stone-900">Notes</h1>
          <Button size="sm" variant="ghost" onClick={handleNew} disabled={isPending} title="New note">
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 space-y-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="animate-pulse h-14 bg-stone-100 rounded-lg" />
              ))}
            </div>
          ) : notes.length === 0 ? (
            <div className="p-6 text-center text-stone-400">
              <StickyNote className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No notes yet</p>
              <button onClick={handleNew} className="text-xs text-stone-500 underline mt-1">Create one</button>
            </div>
          ) : (
            notes.map(note => (
              <button
                key={note.id}
                onClick={() => openNote(note)}
                className={`w-full text-left px-4 py-3 border-b border-stone-50 hover:bg-stone-50 transition-colors group ${activeId === note.id ? 'bg-stone-100' : ''}`}
              >
                <div className="flex items-start justify-between gap-1">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-stone-800 truncate">{note.title || 'Untitled'}</p>
                    <p className="text-xs text-stone-400 mt-0.5">{formatDate(note.updated_at)}</p>
                    {note.content && (
                      <p className="text-xs text-stone-400 truncate mt-0.5">{note.content.slice(0, 60)}</p>
                    )}
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); handleDelete(note) }}
                    className="p-1 rounded text-stone-300 hover:text-red-500 hover:bg-red-50 transition-colors shrink-0"
                    title="Delete note"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 flex flex-col bg-stone-50 overflow-hidden">
        {!activeNote ? (
          <div className="flex-1 flex flex-col items-center justify-center text-stone-400 gap-3">
            <StickyNote className="w-14 h-14 opacity-20" />
            <p className="text-sm">Select a note or create a new one</p>
            <Button variant="outline" onClick={handleNew} disabled={isPending} size="sm">
              <Plus className="w-4 h-4 mr-1" /> New Note
            </Button>
          </div>
        ) : (
          <>
            <div className="px-8 py-4 bg-white border-b border-stone-100 flex items-center justify-between">
              <Input
                className="text-xl font-bold border-0 shadow-none focus-visible:ring-0 px-0 text-stone-900 bg-transparent"
                placeholder="Title"
                value={title}
                onChange={e => handleTitleChange(e.target.value)}
              />
              <div className="flex items-center gap-3 ml-4 shrink-0">
                <span className={`text-xs ${saving ? 'text-stone-400' : 'text-stone-300'}`}>
                  {saving ? 'Saving…' : 'Saved'}
                </span>
                <button
                  onClick={() => activeNote && handleDelete(activeNote)}
                  className="p-1.5 rounded text-stone-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                  title="Delete note"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <textarea
              className="flex-1 px-8 py-6 text-stone-700 text-sm leading-relaxed bg-stone-50 resize-none focus:outline-none"
              placeholder="Start writing…"
              value={content}
              onChange={e => handleContentChange(e.target.value)}
            />
          </>
        )}
      </div>

    </div>
  )
}
