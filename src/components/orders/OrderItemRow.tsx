'use client'

import { useRef, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Trash2, ImageIcon, Camera, Loader2 } from 'lucide-react'
import { getProductImage, getProductThumbnail, PRODUCT_IMAGE_SIZES } from '@/lib/productImages'
import { isSofaCategory } from '@/lib/utils'
import { SOFA_CONFIGURATIONS } from '@/lib/constants'
import { ProductPickerModal } from './ProductPickerModal'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import Image from 'next/image'
import type { Product, OrderItemFormValues } from '@/types'

interface Props {
  item: OrderItemFormValues
  index: number
  onChange: (index: number, field: keyof OrderItemFormValues, value: string | number) => void
  onRemove: (index: number) => void
  products: Product[]
}

export function OrderItemRow({ item, index, onChange, onRemove, products }: Props) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleProductSelect(product: Product) {
    onChange(index, 'product_id', product.id)
    onChange(index, 'model_name', product.model_name)
    onChange(index, 'category', product.category)
    const url = getProductImage(product.model_name, product.default_image_url ?? undefined)
    onChange(index, 'image_url', url)
    if (product.colors.length === 1) onChange(index, 'color', product.colors[0])
    else onChange(index, 'color', '')
    onChange(index, 'sofa_configuration', '')
  }

  async function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const supabase = getSupabaseBrowserClient()
      const ext = file.name.split('.').pop() ?? 'jpg'
      const path = `items/${Date.now()}.${ext}`
      const { data, error } = await supabase.storage
        .from('order-images')
        .upload(path, file, { upsert: true })
      if (error) { toast.error('Image upload failed: ' + error.message); return }
      const { data: { publicUrl } } = supabase.storage.from('order-images').getPublicUrl(data.path)
      onChange(index, 'image_url', publicUrl)
      onChange(index, 'product_id', '')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const product = products.find(p => p.id === item.product_id)
  const issofa = isSofaCategory(item.category)
  const imageUrl = item.image_url || (product ? getProductImage(product.model_name, product.default_image_url ?? undefined) : '')
  const thumbnailUrl = imageUrl ? getProductThumbnail(item.model_name || product?.model_name || '', imageUrl, { width: 160, height: 160 }) : ''

  return (
    <div className="border border-stone-200 rounded-xl p-4 space-y-3 bg-white">
      <div className="flex items-start gap-3">
        {/* Product image + picker/photo buttons */}
        <div className="flex flex-col items-center gap-1.5 shrink-0">
          <button
            onClick={() => setPickerOpen(true)}
            className="w-20 h-20 rounded-xl bg-stone-100 overflow-hidden border-2 border-dashed border-stone-300 hover:border-stone-500 transition-colors relative group"
            title="Click to pick product"
          >
            {imageUrl ? (
              <Image
                src={thumbnailUrl}
                alt={item.model_name || 'Product'}
                fill
                sizes={PRODUCT_IMAGE_SIZES.thumb}
                className="object-cover"
                unoptimized
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-1 text-stone-400 group-hover:text-stone-600">
                <ImageIcon className="w-6 h-6" />
                <span className="text-xs">Pick</span>
              </div>
            )}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded-xl" />
          </button>

          {/* Camera / photo upload button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-1 text-xs text-stone-500 hover:text-stone-800 transition-colors disabled:opacity-50"
            title="Upload a photo"
          >
            {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Camera className="w-3 h-3" />}
            <span>{uploading ? 'Uploading…' : 'Photo'}</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handlePhotoSelect}
          />
        </div>

        <div className="flex-1 grid grid-cols-2 gap-2">
          {/* Model name (auto-filled, editable) */}
          <Input
            className="col-span-2"
            placeholder="Model name (auto-filled when product is selected)"
            value={item.model_name}
            onChange={e => onChange(index, 'model_name', e.target.value)}
          />

          {/* Color */}
          {product && product.colors.length > 0 ? (
            <select
              className="h-9 px-3 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-300"
              value={item.color}
              onChange={e => onChange(index, 'color', e.target.value)}
            >
              <option value="">— Color —</option>
              {product.colors.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          ) : (
            <Input
              placeholder="Color"
              value={item.color}
              onChange={e => onChange(index, 'color', e.target.value)}
            />
          )}

          {/* Category display */}
          <Input
            placeholder="Category"
            value={item.category}
            onChange={e => onChange(index, 'category', e.target.value)}
            className="text-stone-500"
          />

          {/* Sofa config (conditional) */}
          {issofa && (
            <div className="col-span-2">
              <select
                className="w-full h-9 px-3 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-300"
                value={item.sofa_configuration}
                onChange={e => onChange(index, 'sofa_configuration', e.target.value)}
              >
                <option value="">— Sofa Configuration —</option>
                {SOFA_CONFIGURATIONS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          )}

          {/* Qty + Price */}
          <Input
            type="number"
            min="1"
            placeholder="Qty"
            value={item.quantity}
            onChange={e => onChange(index, 'quantity', parseInt(e.target.value) || 1)}
          />
          <Input
            type="number"
            min="0"
            step="0.01"
            placeholder="Unit Price (€)"
            value={item.unit_price || ''}
            onChange={e => onChange(index, 'unit_price', parseFloat(e.target.value) || 0)}
          />

          {/* Item notes */}
          <Textarea
            className="col-span-2 text-sm"
            placeholder="Item notes (e.g. special colour mix, reinforced legs) — shown on PDF"
            value={item.customization_note}
            onChange={e => onChange(index, 'customization_note', e.target.value)}
            rows={2}
          />
        </div>

        <Button variant="ghost" size="sm" onClick={() => onRemove(index)} className="text-red-400 hover:text-red-600 hover:bg-red-50 shrink-0">
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      <div className="text-right text-xs text-stone-500">
        Subtotal: <span className="font-semibold text-stone-700">€ {(item.unit_price * item.quantity).toFixed(2)}</span>
      </div>

      <ProductPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        products={products}
        selectedId={item.product_id}
        onSelect={handleProductSelect}
      />
    </div>
  )
}
