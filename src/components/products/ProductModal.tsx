'use client'

import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { PRODUCT_CATEGORIES } from '@/lib/constants'
import { toast } from 'sonner'
import { Loader2, X } from 'lucide-react'
import type { Product, ProductCategory } from '@/types'

interface Props {
  open: boolean
  onClose: () => void
  product: Product | null
  onSaved: () => void
}

export function ProductModal({ open, onClose, product, onSaved }: Props) {
  const [modelName, setModelName] = useState('')
  const [category, setCategory] = useState<ProductCategory>('Sofa')
  const [colors, setColors] = useState('')
  const [notes, setNotes] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (product) {
      setModelName(product.model_name)
      setCategory(product.category)
      setColors(product.colors?.join(', ') ?? '')
      setNotes(product.notes ?? '')
      setIsActive(product.is_active)
    } else {
      setModelName(''); setCategory('Sofa'); setColors(''); setNotes(''); setIsActive(true)
    }
  }, [product, open])

  async function handleSave() {
    if (!modelName.trim()) { toast.error('Model name is required'); return }
    setSaving(true)
    const supabase = getSupabaseBrowserClient()
    const colorsArr = colors.split(',').map(c => c.trim()).filter(Boolean)
    const payload = { model_name: modelName.trim(), category, colors: colorsArr, notes: notes.trim() || null, is_active: isActive }

    const { error } = product
      ? await supabase.from('products').update(payload).eq('id', product.id)
      : await supabase.from('products').insert(payload)

    setSaving(false)
    if (error) { toast.error(error.message); return }
    toast.success(product ? 'Product updated' : 'Product added')
    onSaved()
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{product ? 'Edit Product' : 'Add Product'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label>Model Name *</Label>
            <Input placeholder="e.g. Avanos, Gucci TV Table" value={modelName} onChange={e => setModelName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Category *</Label>
            <select
              className="w-full h-10 px-3 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-300"
              value={category}
              onChange={e => setCategory(e.target.value as ProductCategory)}
            >
              {PRODUCT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label>Available Colors <span className="text-stone-400 font-normal">(comma separated)</span></Label>
            <Input placeholder="Beige, White, Gray, Anthracite" value={colors} onChange={e => setColors(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea placeholder="Optional notes about this product" value={notes} onChange={e => setNotes(e.target.value)} rows={2} />
          </div>
          <div className="flex items-center gap-3">
            <input type="checkbox" id="isActive" checked={isActive} onChange={e => setIsActive(e.target.checked)} className="w-4 h-4" />
            <Label htmlFor="isActive" className="cursor-pointer">Active (show in order form)</Label>
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button className="flex-1 bg-stone-900 hover:bg-stone-800" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {product ? 'Save Changes' : 'Add Product'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
