'use client'

import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { OrderItemRow } from '@/components/orders/OrderItemRow'
import { formatCurrency } from '@/lib/utils'
import type { Product, OrderItemFormValues } from '@/types'
import type { FormState } from './index'

interface Props {
  form: FormState
  products: Product[]
  setItemField: (index: number, field: keyof OrderItemFormValues, value: string | number) => void
  addItem: () => void
  removeItem: (index: number) => void
}

export function Step2Items({ form, products, setItemField, addItem, removeItem }: Props) {
  const total = form.items.reduce((s, i) => s + i.unit_price * i.quantity, 0)

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-stone-800">Order Items</h2>
        <p className="text-sm text-stone-500 mt-1">Add the products for this order. Select a product to auto-fill details.</p>
      </div>

      {form.items.map((item, i) => (
        <OrderItemRow
          key={i}
          item={item}
          index={i}
          onChange={setItemField}
          onRemove={removeItem}
          products={products}
        />
      ))}

      <Button variant="outline" onClick={addItem} className="w-full border-dashed">
        <Plus className="w-4 h-4 mr-2" /> Add Item
      </Button>

      {form.items.length > 0 && (
        <div className="flex justify-end pt-2 border-t border-stone-100">
          <div className="text-sm">
            <span className="text-stone-500">Calculated Total: </span>
            <span className="font-bold text-stone-900 text-base">{formatCurrency(total)}</span>
          </div>
        </div>
      )}
    </div>
  )
}
