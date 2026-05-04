'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { FACTORY_STATUSES, DELIVERY_STATUSES } from '@/lib/constants'
import type { FormState } from './index'

interface Props {
  form: FormState
  set: <K extends keyof FormState>(key: K, value: FormState[K]) => void
}

export function Step4Tracking({ form, set }: Props) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-stone-800">Tracking & Notes</h2>
        <p className="text-sm text-stone-500 mt-1">Set initial status and add any relevant notes.</p>
      </div>

      <div className="space-y-1.5">
        <Label>Order Source</Label>
        <select
          className="w-full h-10 px-3 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-300"
          value={form.order_source}
          onChange={e => set('order_source', e.target.value)}
        >
          <option value="">Not set</option>
          <option value="depot">Depot</option>
          <option value="turkey">Turkey</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Factory Status</Label>
          <select
            className="w-full h-10 px-3 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-300"
            value={form.factory_status}
            onChange={e => set('factory_status', e.target.value)}
          >
            {FACTORY_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>

        <div className="space-y-1.5">
          <Label>Delivery Status</Label>
          <select
            className="w-full h-10 px-3 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-300"
            value={form.delivery_status}
            onChange={e => set('delivery_status', e.target.value)}
          >
            {DELIVERY_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Expected Delivery Date</Label>
          <Input
            type="date"
            value={form.expected_delivery_date}
            onChange={e => set('expected_delivery_date', e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label>Delivery Address</Label>
          <Input
            placeholder="If different from customer address"
            value={form.delivery_address}
            onChange={e => set('delivery_address', e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Factory Notes</Label>
        <Textarea
          placeholder="Special instructions for the factory (will appear on PDF)"
          value={form.factory_notes}
          onChange={e => set('factory_notes', e.target.value)}
          rows={2}
        />
      </div>

      <div className="space-y-1.5">
        <Label>Internal Notes</Label>
        <Textarea
          placeholder="Internal notes (not shown on factory PDF)"
          value={form.internal_notes}
          onChange={e => set('internal_notes', e.target.value)}
          rows={2}
        />
      </div>
    </div>
  )
}
