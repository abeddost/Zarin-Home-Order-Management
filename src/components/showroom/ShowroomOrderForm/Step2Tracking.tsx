'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { FACTORY_STATUS_OPTIONS, DELIVERY_STATUSES } from '@/lib/constants'
import type { ShowroomFormState } from './index'

interface Props {
  form: ShowroomFormState
  set: <K extends keyof ShowroomFormState>(key: K, value: ShowroomFormState[K]) => void
}

export function Step2Tracking({ form, set }: Props) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-stone-800">Order Details & Tracking</h2>
        <p className="text-sm text-stone-500 mt-1">Set the order date, initial status, and add notes.</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Order Date *</Label>
          <Input
            type="date"
            value={form.order_date}
            onChange={e => set('order_date', e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Expected Delivery Date</Label>
          <Input
            type="date"
            value={form.expected_delivery_date}
            onChange={e => set('expected_delivery_date', e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Factory Status</Label>
          <select
            className="w-full h-10 px-3 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-300"
            value={form.factory_status}
            onChange={e => set('factory_status', e.target.value)}
          >
            {FACTORY_STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
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

      <div className="space-y-1.5">
        <Label>Internal Notes</Label>
        <Textarea
          placeholder="Internal notes for this showroom order…"
          value={form.internal_notes}
          onChange={e => set('internal_notes', e.target.value)}
          rows={3}
        />
      </div>

      <div className="space-y-1.5">
        <Label>Factory Notes</Label>
        <Textarea
          placeholder="Notes for the factory…"
          value={form.factory_notes}
          onChange={e => set('factory_notes', e.target.value)}
          rows={2}
        />
      </div>
    </div>
  )
}
