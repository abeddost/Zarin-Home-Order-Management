'use client'

import { formatCurrency, formatDate } from '@/lib/utils'
import type { ShowroomFormState } from './index'

interface Props {
  form: ShowroomFormState
}

export function Step3Preview({ form }: Props) {
  const totalProduct = form.items.reduce((s, i) => s + i.product_cost * i.quantity, 0)
  const totalLogistics = form.items.reduce((s, i) => s + i.logistics_cost * i.quantity, 0)
  const grandTotal = totalProduct + totalLogistics

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-stone-800">Review Order</h2>
        <p className="text-sm text-stone-500 mt-1">Check the details before submitting.</p>
      </div>

      {/* Order info */}
      <div className="bg-stone-50 rounded-xl p-4 space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-stone-500">Order Date</span>
          <span className="font-medium text-stone-800">{formatDate(form.order_date)}</span>
        </div>
        {form.expected_delivery_date && (
          <div className="flex justify-between">
            <span className="text-stone-500">Expected Delivery</span>
            <span className="font-medium text-stone-800">{formatDate(form.expected_delivery_date)}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-stone-500">Factory Status</span>
          <span className="font-medium text-stone-800">{form.factory_status || '—'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-stone-500">Delivery Status</span>
          <span className="font-medium text-stone-800">{form.delivery_status || '—'}</span>
        </div>
      </div>

      {/* Items */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-stone-700">Items ({form.items.length})</h3>
        {form.items.map((item, i) => (
          <div key={i} className="border border-stone-100 rounded-lg p-3 text-sm space-y-1">
            <div className="font-medium text-stone-800">{item.model_name || '(unnamed)'}</div>
            <div className="text-stone-500 text-xs">{item.category}{item.color ? ` · ${item.color}` : ''}{item.sofa_configuration ? ` · ${item.sofa_configuration}` : ''}</div>
            <div className="flex justify-between text-xs pt-1">
              <span className="text-stone-500">Qty: {item.quantity} · Product: {formatCurrency(item.product_cost * item.quantity)} · Logistics: {formatCurrency(item.logistics_cost * item.quantity)}</span>
              <span className="font-semibold text-stone-700">Total: {formatCurrency((item.product_cost + item.logistics_cost) * item.quantity)}</span>
            </div>
            {item.customization_note && <div className="text-xs text-amber-700 bg-amber-50 rounded px-2 py-1 mt-1">{item.customization_note}</div>}
          </div>
        ))}
      </div>

      {/* Cost summary */}
      <div className="bg-stone-900 text-white rounded-xl p-4 space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-stone-300">Total Product Cost</span>
          <span className="font-medium">{formatCurrency(totalProduct)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-stone-300">Total Logistics Cost</span>
          <span className="font-medium">{formatCurrency(totalLogistics)}</span>
        </div>
        <div className="flex justify-between border-t border-stone-700 pt-2 mt-1">
          <span className="font-bold">Grand Total (Approx.)</span>
          <span className="font-bold text-base">{formatCurrency(grandTotal)}</span>
        </div>
      </div>

      {form.internal_notes && (
        <div className="text-sm text-stone-600 bg-stone-50 rounded-lg p-3">
          <span className="font-medium text-stone-700">Notes: </span>{form.internal_notes}
        </div>
      )}
    </div>
  )
}
