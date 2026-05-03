'use client'

import { useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { EditPaymentModal } from './EditPaymentModal'
import { deletePayment } from '@/actions/orders'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { Payment } from '@/types'

interface Props {
  payments: Payment[]
  orderId: string
  downPayment: number
  orderDate: string
  paidSum: number
}

export function PaymentHistorySection({ payments, orderId, downPayment, orderDate, paidSum }: Props) {
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function handleDelete(payment: Payment) {
    if (!confirm(`Delete payment of ${formatCurrency(payment.amount)}? This cannot be undone.`)) return
    setDeletingId(payment.id)
    const result = await deletePayment(payment.id, orderId)
    setDeletingId(null)
    if (result.error) { toast.error(result.error); return }
    toast.success('Payment deleted')
  }

  return (
    <>
      <div className="space-y-2">
        {/* Down payment — read-only synthetic row */}
        {downPayment > 0 && (
          <div className="flex items-center justify-between py-2 border-b border-stone-50">
            <div>
              <p className="text-sm font-medium text-stone-700">{formatCurrency(downPayment)}</p>
              <p className="text-xs text-stone-400">{formatDate(orderDate)} · Down Payment / Anzahlung</p>
            </div>
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Down Payment</span>
          </div>
        )}

        {/* Recorded payments with edit/delete */}
        {payments.map(p => (
          <div key={p.id} className="flex items-center justify-between py-2 border-b border-stone-50 last:border-0 group">
            <div>
              <p className="text-sm font-medium text-stone-700">{formatCurrency(p.amount)}</p>
              <p className="text-xs text-stone-400">{formatDate(p.payment_date)} · {p.payment_method ?? 'cash'}</p>
              {p.notes && <p className="text-xs text-stone-400 italic">{p.notes}</p>}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Recorded</span>
              <button
                onClick={() => setEditingPayment(p)}
                className="p-1 rounded text-stone-300 hover:text-stone-600 hover:bg-stone-100 transition-colors opacity-0 group-hover:opacity-100"
                title="Edit payment"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleDelete(p)}
                disabled={deletingId === p.id}
                className="p-1 rounded text-stone-300 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50"
                title="Delete payment"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}

        {downPayment === 0 && payments.length === 0 && (
          <p className="text-stone-400 text-sm">No payments recorded.</p>
        )}

        {/* Running total */}
        {(downPayment > 0 || payments.length > 0) && (
          <div className="flex justify-between pt-2 border-t border-stone-200 mt-2">
            <span className="text-sm text-stone-500">Total Paid</span>
            <span className="text-sm font-bold text-stone-800">{formatCurrency(downPayment + paidSum)}</span>
          </div>
        )}
      </div>

      {editingPayment && (
        <EditPaymentModal
          open={true}
          onClose={() => setEditingPayment(null)}
          orderId={orderId}
          payment={editingPayment}
        />
      )}
    </>
  )
}
