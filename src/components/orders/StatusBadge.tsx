import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { ORDER_STATUSES, FACTORY_STATUSES, DELIVERY_STATUSES, PAYMENT_STATUSES } from '@/lib/constants'
import type { OrderStatus, FactoryStatus, DeliveryStatus, PaymentStatus } from '@/types'

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const found = ORDER_STATUSES.find(s => s.value === status)
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium', found?.color ?? 'bg-gray-100 text-gray-600')}>
      {found?.label ?? status}
    </span>
  )
}

export function FactoryStatusBadge({ status }: { status: FactoryStatus | null | undefined }) {
  if (!status) return null
  const found = FACTORY_STATUSES.find(s => s.value === status)
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium', found?.color ?? 'bg-gray-100 text-gray-600')}>
      {found?.label ?? status}
    </span>
  )
}

export function DeliveryStatusBadge({ status }: { status: DeliveryStatus | null | undefined }) {
  if (!status) return null
  const found = DELIVERY_STATUSES.find(s => s.value === status)
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium', found?.color ?? 'bg-gray-100 text-gray-600')}>
      {found?.label ?? status}
    </span>
  )
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const found = PAYMENT_STATUSES.find(s => s.value === status)
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium', found?.color ?? 'bg-gray-100 text-gray-600')}>
      {found?.label ?? status}
    </span>
  )
}
