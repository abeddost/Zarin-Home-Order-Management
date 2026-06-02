'use client'

import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Trash2, ImageIcon, Camera, Loader2 } from 'lucide-react'
import { getProductImage, getProductThumbnail, PRODUCT_IMAGE_SIZES } from '@/lib/productImages'
import { isSofaCategory, formatCurrency } from '@/lib/utils'
import { SOFA_CONFIGURATIONS } from '@/lib/constants'
import { ProductPickerModal } from '@/components/orders/ProductPickerModal'
import { uploadOptimizedOrderPhoto } from '@/lib/orderPhotoUpload'
import { toast } from 'sonner'
import Image from 'next/image'
import type { Product, OrderItemFormValues } from '@/types'
import type { ShowroomFormState } from './index'

interface Props {
  form: ShowroomFormState
  products: Product[]
  setItemField: (index: number, field: keyof OrderItemFormValues, value: string | number) => void
  addItem: () => void
  removeItem: (index: number) => void
}

function ShowroomItemRow({
  item, index, products, onChange, onRemove,
}: {
  item: OrderItemFormValues
  index: number
  products: Product[]
  onChange: (index: number, field: keyof OrderItemFormValues, value: string | number) => void
  onRemove: (index: number) => void
}) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)

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
      const publicUrl = await uploadOptimizedOrderPhoto(file)
      onChange(index, 'image_url', publicUrl)
      onChange(index, 'product_id', '')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Image upload failed')
    } finally {
      setUploading(false)
      if (cameraInputRef.current) cameraInputRef.current.value = ''
      if (galleryInputRef.current) galleryInputRef.current.value = ''
    }
  }

  const product = products.find(p => p.id === item.product_id)
  const issofa = isSofaCategory(item.category)
  const imageUrl = item.image_url || (product ? getProductImage(product.model_name, product.default_image_url ?? undefined) : '')
  const thumbnailUrl = imageUrl ? getProductThumbnail(item.model_name || product?.model_name || '', imageUrl, { width: 160, height: 160 }) : ''
  const itemTotal = (item.product_cost + item.logistics_cost) * item.quantity

  return (
    <div className="border border-stone-200 rounded-xl p-4 space-y-3 bg-white">
      <div className="flex items-start gap-3">
        {/* Product image + picker */}
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
          <div className="flex flex-col items-center gap-1">
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-1 text-xs text-stone-500 hover:text-stone-800 transition-colors disabled:opacity-50"
              title="Take a photo"
            >
              {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Camera className="w-3 h-3" />}
              <span>{uploading ? 'Uploading...' : 'Camera'}</span>
            </button>
            <button
              type="button"
              onClick={() => galleryInputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-1 text-xs text-stone-500 hover:text-stone-800 transition-colors disabled:opacity-50"
              title="Choose from gallery"
            >
              <ImageIcon className="w-3 h-3" />
              <span>Gallery</span>
            </button>
          </div>
          <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhotoSelect} />
          <input ref={galleryInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoSelect} />
        </div>

        <div className="flex-1 grid grid-cols-2 gap-2">
          <Input
            className="col-span-2"
            placeholder="Model name (auto-filled when product is selected)"
            value={item.model_name}
            onChange={e => onChange(index, 'model_name', e.target.value)}
          />

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
            <Input placeholder="Color" value={item.color} onChange={e => onChange(index, 'color', e.target.value)} />
          )}

          <Input
            placeholder="Category"
            value={item.category}
            onChange={e => onChange(index, 'category', e.target.value)}
            className="text-stone-500"
          />

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

          <Input
            type="number"
            min="1"
            placeholder="Qty"
            value={item.quantity}
            onChange={e => onChange(index, 'quantity', parseInt(e.target.value) || 1)}
          />

          {/* Empty cell to keep grid aligned */}
          <div />

          {/* Cost fields */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-stone-500">Product Cost (€)</label>
            <Input
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={item.product_cost || ''}
              onChange={e => onChange(index, 'product_cost', parseFloat(e.target.value) || 0)}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-stone-500">Logistics Cost (€)</label>
            <Input
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={item.logistics_cost || ''}
              onChange={e => onChange(index, 'logistics_cost', parseFloat(e.target.value) || 0)}
            />
          </div>

          <Textarea
            className="col-span-2 text-sm"
            placeholder="Item notes — shown on PDF"
            value={item.customization_note}
            onChange={e => onChange(index, 'customization_note', e.target.value)}
            rows={2}
          />
        </div>

        <Button variant="ghost" size="sm" onClick={() => onRemove(index)} className="text-red-400 hover:text-red-600 hover:bg-red-50 shrink-0">
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex justify-between items-center text-xs text-stone-500 border-t border-stone-50 pt-2">
        <span>Product: {formatCurrency(item.product_cost * item.quantity)} · Logistics: {formatCurrency(item.logistics_cost * item.quantity)}</span>
        <span>Item Total: <span className="font-semibold text-stone-700">{formatCurrency(itemTotal)}</span></span>
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

export function Step1Items({ form, products, setItemField, addItem, removeItem }: Props) {
  const totalProduct = form.items.reduce((s, i) => s + i.product_cost * i.quantity, 0)
  const totalLogistics = form.items.reduce((s, i) => s + i.logistics_cost * i.quantity, 0)
  const grandTotal = totalProduct + totalLogistics

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-stone-800">Showroom Items</h2>
        <p className="text-sm text-stone-500 mt-1">Add items and enter the approximate Turkey costs per item.</p>
      </div>

      {form.items.map((item, i) => (
        <ShowroomItemRow
          key={i}
          item={item}
          index={i}
          products={products}
          onChange={setItemField}
          onRemove={removeItem}
        />
      ))}

      <Button variant="outline" onClick={addItem} className="w-full border-dashed">
        <Plus className="w-4 h-4 mr-2" /> Add Item
      </Button>

      {form.items.length > 0 && (
        <div className="flex flex-col items-end gap-1 pt-2 border-t border-stone-100 text-sm">
          <div className="text-stone-500">Product Costs: <span className="font-medium text-stone-800">{formatCurrency(totalProduct)}</span></div>
          <div className="text-stone-500">Logistics Costs: <span className="font-medium text-stone-800">{formatCurrency(totalLogistics)}</span></div>
          <div className="text-stone-500 font-medium">Grand Total: <span className="font-bold text-stone-900 text-base">{formatCurrency(grandTotal)}</span></div>
        </div>
      )}
    </div>
  )
}
