'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Check } from 'lucide-react'
import Image from 'next/image'
import { getProductImage } from '@/lib/productImages'
import { SOFA_CATEGORIES } from '@/lib/constants'
import type { Product } from '@/types'

interface Props {
  open: boolean
  onClose: () => void
  products: Product[]
  selectedId: string
  onSelect: (product: Product) => void
}

function ProductGrid({ items, selectedId, onSelect }: { items: Product[]; selectedId: string; onSelect: (p: Product) => void }) {
  if (items.length === 0) {
    return <div className="py-10 text-center text-stone-400 text-sm">No products in this category</div>
  }
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 max-h-[420px] overflow-y-auto pr-1">
      {items.map(p => {
        const imgUrl = getProductImage(p.model_name, p.default_image_url ?? undefined)
        const isSelected = p.id === selectedId
        return (
          <button
            key={p.id}
            onClick={() => onSelect(p)}
            className={`rounded-xl border-2 overflow-hidden text-left transition-all hover:shadow-md ${
              isSelected ? 'border-stone-900 shadow-lg' : 'border-stone-100 hover:border-stone-300'
            }`}
          >
            <div className="aspect-[4/3] bg-stone-100 relative">
              <Image src={imgUrl} alt={p.model_name} fill className="object-cover" unoptimized />
              {isSelected && (
                <div className="absolute inset-0 bg-stone-900/20 flex items-center justify-center">
                  <div className="w-7 h-7 rounded-full bg-stone-900 flex items-center justify-center shadow">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                </div>
              )}
            </div>
            <div className="p-2 bg-white">
              <p className="text-xs font-semibold text-stone-800 truncate">{p.model_name}</p>
              <p className="text-xs text-stone-400 truncate">{p.category}</p>
            </div>
          </button>
        )
      })}
    </div>
  )
}

export function ProductPickerModal({ open, onClose, products, selectedId, onSelect }: Props) {
  const active = products.filter(p => p.is_active)
  const sofas = active.filter(p => SOFA_CATEGORIES.includes(p.category))
  const tables = active.filter(p => !SOFA_CATEGORIES.includes(p.category))

  function handleSelect(product: Product) {
    onSelect(product)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Select Product</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="sofas" className="mt-1">
          <TabsList className="mb-4">
            <TabsTrigger value="sofas">Sofas ({sofas.length})</TabsTrigger>
            <TabsTrigger value="tables">Tables &amp; Others ({tables.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="sofas">
            <ProductGrid items={sofas} selectedId={selectedId} onSelect={handleSelect} />
          </TabsContent>
          <TabsContent value="tables">
            <ProductGrid items={tables} selectedId={selectedId} onSelect={handleSelect} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
