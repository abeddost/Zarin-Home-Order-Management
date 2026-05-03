import { formatDatetime } from '@/lib/utils'
import { ORDER_STATUSES, FACTORY_STATUSES, DELIVERY_STATUSES, PAYMENT_STATUSES } from '@/lib/constants'
import type { OrderStatusHistory } from '@/types'

const fieldLabel: Record<string, string> = {
  order_status: 'Order Status',
  factory_status: 'Factory Status',
  delivery_status: 'Delivery Status',
  payment_status: 'Payment Status',
}

function getStatusLabel(field: string, value: string | null): string {
  if (!value) return '—'
  const allStatuses = [...ORDER_STATUSES, ...FACTORY_STATUSES, ...DELIVERY_STATUSES, ...PAYMENT_STATUSES]
  return allStatuses.find(s => s.value === value)?.label ?? value
}

interface Props {
  history: OrderStatusHistory[]
}

export function OrderTimeline({ history }: Props) {
  if (history.length === 0) {
    return (
      <p className="text-stone-400 text-sm py-4">No status changes recorded yet.</p>
    )
  }

  return (
    <ol className="relative border-l border-stone-200 ml-3 space-y-4">
      {[...history].reverse().map((entry) => (
        <li key={entry.id} className="ml-6">
          <span className="absolute -left-2 flex h-4 w-4 items-center justify-center rounded-full bg-stone-100 border border-stone-300">
            <span className="h-1.5 w-1.5 rounded-full bg-stone-500" />
          </span>
          <div className="text-xs text-stone-400 mb-0.5">{formatDatetime(entry.created_at)}</div>
          <div className="text-sm text-stone-700">
            <span className="font-medium">{fieldLabel[entry.field_changed] ?? entry.field_changed}:</span>{' '}
            <span className="line-through text-stone-400">{getStatusLabel(entry.field_changed, entry.old_status)}</span>
            {' → '}
            <span className="font-medium text-stone-800">{getStatusLabel(entry.field_changed, entry.new_status)}</span>
          </div>
          {entry.note && <p className="text-xs text-stone-500 mt-0.5 italic">{entry.note}</p>}
        </li>
      ))}
    </ol>
  )
}
