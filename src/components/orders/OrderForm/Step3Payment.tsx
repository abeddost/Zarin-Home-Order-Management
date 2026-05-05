'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { PAYMENT_METHODS } from '@/lib/constants'
import { formatCurrency } from '@/lib/utils'
import type { FormState } from './index'

interface Props {
  form: FormState
  set: <K extends keyof FormState>(key: K, value: FormState[K]) => void
}

export function Step3Payment({ form, set }: Props) {
  const remaining = form.total_price - form.down_payment

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-stone-800">Payment Details</h2>
        <p className="text-sm text-stone-500 mt-1">Set the total price, down payment, and payment method.</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Total Price (€) *</Label>
          <Input
            type="number"
            min="0"
            step="0.01"
            value={form.total_price || ''}
            onChange={e => set('total_price', parseFloat(e.target.value) || 0)}
          />
          <p className="text-xs text-stone-400">Auto-calculated from items, can be adjusted</p>
        </div>

        <div className="space-y-1.5">
          <Label>Down Payment (€)</Label>
          <Input
            type="number"
            min="0"
            step="0.01"
            value={form.down_payment || ''}
            onChange={e => set('down_payment', parseFloat(e.target.value) || 0)}
          />
        </div>
      </div>

      {/* Remaining balance display */}
      <div className="bg-stone-50 rounded-xl p-4 grid grid-cols-3 gap-4 text-center">
        <div>
          <p className="text-xs text-stone-400 mb-1">Total</p>
          <p className="font-bold text-stone-800">{formatCurrency(form.total_price)}</p>
        </div>
        <div>
          <p className="text-xs text-stone-400 mb-1">Down Payment</p>
          <p className="font-bold text-blue-700">{formatCurrency(form.down_payment)}</p>
        </div>
        <div>
          <p className="text-xs text-stone-400 mb-1">Remaining</p>
          <p className={`font-bold ${remaining > 0 ? 'text-orange-600' : 'text-green-600'}`}>
            {formatCurrency(Math.max(0, remaining))}
          </p>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Payment Method *</Label>
        <select
          className="w-full h-10 px-3 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-300"
          value={form.payment_method}
          onChange={e => set('payment_method', e.target.value)}
        >
          <option value="">— Select method —</option>
          {PAYMENT_METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
        </select>
      </div>

      <div className="space-y-1.5">
        <Label>Payment Notes</Label>
        <Textarea
          placeholder="e.g. Down payment received 03.05.2026 by cash"
          value={form.payment_notes}
          onChange={e => set('payment_notes', e.target.value)}
          rows={2}
        />
      </div>
    </div>
  )
}
