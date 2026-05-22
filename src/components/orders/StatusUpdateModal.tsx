'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { updateOrderStatus, updateFactoryStatus, updateDeliveryStatus } from '@/actions/orders'
import { ORDER_STATUSES, FACTORY_STATUS_OPTIONS, DELIVERY_STATUSES } from '@/lib/constants'
import type { OrderStatus, FactoryStatus, DeliveryStatus } from '@/types'

type StatusType = 'order' | 'factory' | 'delivery'

interface Props {
  open: boolean
  onClose: () => void
  orderId: string
  type: StatusType
  currentStatus: string
}

const CONFIG: Record<StatusType, { title: string; options: { value: string; label: string }[] }> = {
  order:    { title: 'Update Order Status',    options: ORDER_STATUSES },
  factory:  { title: 'Update Factory Status',  options: FACTORY_STATUS_OPTIONS },
  delivery: { title: 'Update Delivery Status', options: DELIVERY_STATUSES },
}

export function StatusUpdateModal({ open, onClose, orderId, type, currentStatus }: Props) {
  const config = CONFIG[type]
  const [status, setStatus] = useState(currentStatus)
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (status === currentStatus) { onClose(); return }
    setSaving(true)
    let result: { error?: string }
    if (type === 'order') {
      result = await updateOrderStatus(orderId, status as OrderStatus)
    } else if (type === 'factory') {
      result = await updateFactoryStatus(orderId, status as FactoryStatus, notes)
    } else {
      result = await updateDeliveryStatus(orderId, status as DeliveryStatus)
    }
    setSaving(false)
    if (result.error) { toast.error(result.error); return }
    toast.success('Status updated')
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{config.title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label>New Status</Label>
            <select
              className="w-full h-10 px-3 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-300"
              value={status}
              onChange={e => setStatus(e.target.value)}
            >
              {config.options.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          {type === 'factory' && (
            <div className="space-y-1.5">
              <Label>Factory Notes (optional)</Label>
              <Textarea
                placeholder="Add notes for the factory..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={2}
              />
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button className="flex-1 bg-stone-900 hover:bg-stone-800" onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Update
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
