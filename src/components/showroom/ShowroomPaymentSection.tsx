'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Plus, Trash2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { addPayment, deletePayment } from '@/actions/orders'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { Payment } from '@/types'

interface Props {
  payments: Payment[]
  orderId: string
  totalCost: number
}

export function ShowroomPaymentSection({ payments, orderId, totalCost }: Props) {
  const [open, setOpen] = useState(false)
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [notes, setNotes] = useState('')
  const [isPending, startTransition] = useTransition()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const paidSum = payments.reduce((s, p) => s + p.amount, 0)
  const remaining = Math.max(0, totalCost - paidSum)

  function handleAdd() {
    const parsed = parseFloat(amount)
    if (!parsed || parsed <= 0) { toast.error('Enter a valid amount'); return }
    if (!date) { toast.error('Date is required'); return }

    startTransition(async () => {
      const result = await addPayment(orderId, parsed, 'bank_transfer', date, notes || undefined)
      if (result.error) { toast.error(result.error); return }
      toast.success('Payment recorded')
      setAmount('')
      setNotes('')
      setDate(new Date().toISOString().split('T')[0])
      setOpen(false)
    })
  }

  async function handleDelete(payment: Payment) {
    if (!confirm(`Delete payment of ${formatCurrency(payment.amount)}?`)) return
    setDeletingId(payment.id)
    const result = await deletePayment(payment.id, orderId)
    setDeletingId(null)
    if (result.error) { toast.error(result.error); return }
    toast.success('Payment deleted')
  }

  return (
    <div className="bg-white rounded-xl border border-stone-100 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-stone-50 flex items-center justify-between">
        <h2 className="font-semibold text-stone-800">Supplier Payments</h2>
        <Button size="sm" onClick={() => setOpen(true)} className="bg-stone-900 hover:bg-stone-800">
          <Plus className="w-3.5 h-3.5 mr-1.5" /> Record Payment
        </Button>
      </div>

      <div className="px-6 py-4 space-y-2">
        {payments.length === 0 ? (
          <p className="text-sm text-stone-400">No payments recorded yet.</p>
        ) : (
          payments.map(p => (
            <div key={p.id} className="flex items-center justify-between py-2 border-b border-stone-50 last:border-0 group">
              <div>
                <p className="text-sm font-medium text-stone-700">{formatCurrency(p.amount)}</p>
                <p className="text-xs text-stone-400">{formatDate(p.payment_date)}</p>
                {p.notes && <p className="text-xs text-stone-400 italic">{p.notes}</p>}
              </div>
              <button
                onClick={() => handleDelete(p)}
                disabled={deletingId === p.id}
                className="p-1 rounded text-stone-300 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50"
                title="Delete payment"
              >
                {deletingId === p.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
              </button>
            </div>
          ))
        )}

        {/* Summary */}
        <div className="pt-3 space-y-1.5 border-t border-stone-100 mt-2 text-sm">
          <div className="flex justify-between text-stone-500">
            <span>Total Cost</span>
            <span className="font-medium text-stone-800">{formatCurrency(totalCost)}</span>
          </div>
          <div className="flex justify-between text-stone-500">
            <span>Paid to Supplier</span>
            <span className="font-medium text-stone-800">{formatCurrency(paidSum)}</span>
          </div>
          <div className="flex justify-between font-semibold">
            <span className={remaining === 0 ? 'text-green-700' : 'text-stone-700'}>
              {remaining === 0 ? 'Fully Paid' : 'Remaining Balance'}
            </span>
            <span className={remaining === 0 ? 'text-green-700' : 'text-red-600'}>
              {formatCurrency(remaining)}
            </span>
          </div>
        </div>
      </div>

      {/* Record Payment Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Supplier Payment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label>Amount (€) *</Label>
              <Input
                type="number"
                min="0.01"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label>Payment Date *</Label>
              <Input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Notes (optional)</Label>
              <Textarea
                placeholder="Transfer reference, invoice number…"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={2}
              />
            </div>
            {remaining > 0 && (
              <p className="text-xs text-stone-400">
                Remaining balance after this payment: {formatCurrency(Math.max(0, remaining - (parseFloat(amount) || 0)))}
              </p>
            )}
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={handleAdd} disabled={isPending} className="bg-stone-900 hover:bg-stone-800">
                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Payment'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
