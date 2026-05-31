import { getSupabaseServerClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ChevronLeft, Factory, Truck, Package, Pencil, AlertTriangle } from 'lucide-react'
import { FactoryStatusBadge, DeliveryStatusBadge } from '@/components/orders/StatusBadge'
import { RestoreOrderButton } from '@/components/orders/RestoreOrderButton'
import { formatCurrency, formatDate, isSofaCategory } from '@/lib/utils'
import { getProductThumbnail, PRODUCT_IMAGE_SIZES } from '@/lib/productImages'
import { ShowroomPDFButton } from '@/components/showroom/ShowroomPDFButton'
import { ShowroomFactoryPDFButton } from '@/components/showroom/ShowroomFactoryPDFButton'
import { ShowroomPaymentSection } from '@/components/showroom/ShowroomPaymentSection'
import type { Order, Payment } from '@/types'

interface Props { params: Promise<{ id: string }> }

export default async function ShowroomOrderDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await getSupabaseServerClient()

  const [orderResult, paymentsResult] = await Promise.all([
    supabase
      .from('orders')
      .select('id, order_number, order_month, monthly_sequence, customer_id, order_date, total_price, down_payment, remaining_balance, payment_status, payment_method, payment_notes, order_status, factory_status, delivery_status, expected_delivery_date, delivery_address, internal_notes, factory_notes, pdf_url, order_source, created_by, created_at, updated_at, deleted_at, order_items(id, order_id, product_id, model_name, category, sofa_configuration, color, quantity, image_url, unit_price, product_cost, logistics_cost, customization_note, created_at)')
      .eq('id', id)
      .eq('order_source', 'showroom')
      .single(),
    supabase
      .from('payments')
      .select('id, order_id, amount, payment_method, payment_date, notes, created_at')
      .eq('order_id', id)
      .order('payment_date', { ascending: true }),
  ])

  if (orderResult.error || !orderResult.data) notFound()

  const order = orderResult.data as unknown as Order
  const payments = (paymentsResult.data ?? []) as Payment[]
  const items = order.order_items ?? []
  const totalProduct = items.reduce((s, i) => s + (i.product_cost ?? 0) * i.quantity, 0)
  const totalLogistics = items.reduce((s, i) => s + (i.logistics_cost ?? 0) * i.quantity, 0)
  const grandTotal = totalProduct + totalLogistics
  const paidSum = payments.reduce((s, p) => s + p.amount, 0)
  const remaining = Math.max(0, grandTotal - paidSum)

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <Link href="/admin420/show-room-orders" className="inline-flex items-center gap-1 text-sm text-stone-500 hover:text-stone-800 mb-3">
          <ChevronLeft className="w-4 h-4" /> Back to Show-Room Orders
        </Link>
        <div className="flex flex-wrap items-start gap-4 justify-between">
          <div>
            <h1 className="text-2xl font-bold text-stone-900 font-mono">Showroom Order #{order.order_number}</h1>
            <p className="text-stone-500 text-sm mt-1">Created {formatDate(order.created_at)} · Order date: {formatDate(order.order_date)}</p>
          </div>
          <div className="flex items-center gap-2">
            {order.deleted_at ? (
              <RestoreOrderButton orderId={order.id} />
            ) : (
              <>
                <Link
                  href={`/admin420/show-room-orders/${order.id}/edit`}
                  className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 border border-stone-200 rounded-lg hover:bg-stone-50 text-stone-600 hover:text-stone-900 transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5" /> Edit
                </Link>
                <ShowroomFactoryPDFButton orderId={order.id} />
                <ShowroomPDFButton orderId={order.id} />
              </>
            )}
          </div>
        </div>
      </div>

      {order.deleted_at && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>This order was deleted on {formatDate(order.deleted_at)}. Restore it to make it active again.</span>
        </div>
      )}

      {/* Status chips */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2 bg-white border border-stone-100 rounded-xl px-4 py-2.5">
          <Factory className="w-4 h-4 text-stone-400" />
          <span className="text-xs text-stone-400 mr-1">Factory</span>
          <FactoryStatusBadge status={order.factory_status ?? 'not_sent'} />
        </div>
        <div className="flex items-center gap-2 bg-white border border-stone-100 rounded-xl px-4 py-2.5">
          <Truck className="w-4 h-4 text-stone-400" />
          <span className="text-xs text-stone-400 mr-1">Delivery</span>
          <DeliveryStatusBadge status={order.delivery_status ?? 'not_scheduled'} />
        </div>
        {order.expected_delivery_date && (
          <div className="flex items-center gap-2 bg-white border border-stone-100 rounded-xl px-4 py-2.5">
            <Package className="w-4 h-4 text-stone-400" />
            <span className="text-xs text-stone-400 mr-1">Expected</span>
            <span className="text-sm font-medium text-stone-800">{formatDate(order.expected_delivery_date)}</span>
          </div>
        )}
      </div>

      {/* Items */}
      <div className="bg-white rounded-xl border border-stone-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-stone-50">
          <h2 className="font-semibold text-stone-800">Items ({items.length})</h2>
        </div>
        <div className="divide-y divide-stone-50">
          {items.map((item, i) => {
            const thumbUrl = item.image_url
              ? getProductThumbnail(item.model_name, item.image_url, { width: 80, height: 80 })
              : ''
            const itemProductCost = (item.product_cost ?? 0) * item.quantity
            const itemLogisticsCost = (item.logistics_cost ?? 0) * item.quantity
            const itemTotal = itemProductCost + itemLogisticsCost
            return (
              <div key={i} className="px-6 py-4 flex items-start gap-4">
                {thumbUrl ? (
                  <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-stone-100 shrink-0">
                    <Image src={thumbUrl} alt={item.model_name} fill sizes={PRODUCT_IMAGE_SIZES.thumb} className="object-cover" unoptimized />
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-stone-100 shrink-0 flex items-center justify-center text-stone-300 text-xs">No img</div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-stone-800">{item.model_name}</div>
                  <div className="text-xs text-stone-500 mt-0.5">
                    {item.category}
                    {item.color ? ` · ${item.color}` : ''}
                    {isSofaCategory(item.category) && item.sofa_configuration ? ` · ${item.sofa_configuration}` : ''}
                    {' · '}Qty: {item.quantity}
                  </div>
                  {item.customization_note && (
                    <div className="mt-1 text-xs bg-amber-50 text-amber-700 rounded px-2 py-1 inline-block">{item.customization_note}</div>
                  )}
                </div>
                <div className="text-right text-sm shrink-0 space-y-0.5">
                  <div className="text-stone-500 text-xs">Product: <span className="text-stone-700 font-medium">{formatCurrency(itemProductCost)}</span></div>
                  <div className="text-stone-500 text-xs">Logistics: <span className="text-stone-700 font-medium">{formatCurrency(itemLogisticsCost)}</span></div>
                  <div className="font-bold text-stone-900">{formatCurrency(itemTotal)}</div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Cost summary + payment status */}
      <div className="bg-stone-900 text-white rounded-xl p-6">
        <h2 className="font-semibold text-stone-300 text-sm mb-4">Approximate Turkey Costs</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-stone-400">Total Product Cost</span>
            <span className="font-medium">{formatCurrency(totalProduct)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-stone-400">Total Logistics Cost</span>
            <span className="font-medium">{formatCurrency(totalLogistics)}</span>
          </div>
          <div className="flex justify-between border-t border-stone-700 pt-3 mt-2">
            <span className="font-bold text-base">Grand Total</span>
            <span className="font-bold text-xl">{formatCurrency(grandTotal)}</span>
          </div>
          <div className="flex justify-between border-t border-stone-700 pt-3 mt-2">
            <span className="text-stone-400">Paid to Supplier</span>
            <span className="font-medium text-green-400">{formatCurrency(paidSum)}</span>
          </div>
          <div className="flex justify-between">
            <span className={remaining === 0 ? 'text-green-400 font-semibold' : 'text-red-400 font-semibold'}>
              {remaining === 0 ? 'Fully Paid' : 'Remaining Balance'}
            </span>
            <span className={`font-bold text-lg ${remaining === 0 ? 'text-green-400' : 'text-red-400'}`}>
              {formatCurrency(remaining)}
            </span>
          </div>
        </div>
      </div>

      {/* Supplier Payments */}
      <ShowroomPaymentSection payments={payments} orderId={order.id} totalCost={grandTotal} />

      {/* Notes */}
      {(order.internal_notes || order.factory_notes) && (
        <div className="bg-white rounded-xl border border-stone-100 shadow-sm p-6 space-y-4">
          {order.internal_notes && (
            <div>
              <h3 className="text-sm font-semibold text-stone-700 mb-1">Internal Notes</h3>
              <p className="text-sm text-stone-600">{order.internal_notes}</p>
            </div>
          )}
          {order.factory_notes && (
            <div>
              <h3 className="text-sm font-semibold text-stone-700 mb-1">Factory Notes</h3>
              <p className="text-sm text-stone-600">{order.factory_notes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
