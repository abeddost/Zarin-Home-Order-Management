import { getSupabaseServerClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ChevronLeft, Factory, Truck, Package } from 'lucide-react'
import { OrderStatusBadge, FactoryStatusBadge, DeliveryStatusBadge } from '@/components/orders/StatusBadge'
import { OrderTimeline } from '@/components/orders/OrderTimeline'
import { formatCurrency, formatDate, isSofaCategory } from '@/lib/utils'
import { getProductImage, PRODUCT_IMAGE_SIZES } from '@/lib/productImages'
import { getUserAccess } from '@/lib/access'
import type { Order, Payment, OrderStatusHistory } from '@/types'

// Thin client wrapper just for status modals
import { FactoryOrderActions } from '@/components/orders/FactoryOrderActions'

interface Props { params: Promise<{ id: string }> }

export default async function FactoryOrderDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await getSupabaseServerClient()

  const [userResult, orderResult, paymentsResult, historyResult] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from('orders').select('id, order_number, order_month, monthly_sequence, customer_id, order_date, total_price, down_payment, remaining_balance, payment_status, payment_method, payment_notes, order_status, factory_status, delivery_status, expected_delivery_date, delivery_address, internal_notes, factory_notes, pdf_url, order_source, created_by, created_at, updated_at, customer:customers(id, name, phone, email, address, city, postal_code, notes, created_at), order_items(id, order_id, product_id, model_name, category, sofa_configuration, color, quantity, image_url, unit_price, customization_note, created_at)').eq('id', id).single(),
    supabase.from('payments').select('amount').eq('order_id', id),
    supabase.from('order_status_history').select('id, order_id, old_status, new_status, field_changed, note, changed_by, created_at').eq('order_id', id).order('created_at', { ascending: true }),
  ])

  if (orderResult.error || !orderResult.data) notFound()

  const order = orderResult.data as unknown as Order
  const access = getUserAccess(userResult.data.user)
  if (access === 'factory-products' && order.order_source !== 'turkey') notFound()

  const history = (historyResult.data ?? []) as OrderStatusHistory[]
  const paidSum = ((paymentsResult.data ?? []) as Payment[]).reduce((s, p) => s + p.amount, 0)
  const trueRemaining = Math.max(0, order.remaining_balance - paidSum)

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <Link href="/factory/orders" className="inline-flex items-center gap-1 text-sm text-stone-500 hover:text-stone-800 mb-3">
          <ChevronLeft className="w-4 h-4" /> Back to Orders
        </Link>
        <div className="flex flex-wrap items-start gap-4 justify-between">
          <div>
            <h1 className="text-2xl font-bold text-stone-900 font-mono">Order #{order.order_number}</h1>
            <p className="text-stone-500 text-sm mt-1">Order date: {formatDate(order.order_date)}</p>
          </div>
          <FactoryOrderActions order={order} />
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2 bg-white border border-stone-100 rounded-xl px-4 py-2.5">
          <Package className="w-4 h-4 text-stone-400" />
          <span className="text-xs text-stone-400 mr-1">Order</span>
          <OrderStatusBadge status={order.order_status} />
        </div>
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
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items — no prices */}
          <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5">
            <h2 className="font-semibold text-stone-800 mb-4">Order Items</h2>
            <div className="space-y-3">
              {(order.order_items ?? []).map(item => (
                <div key={item.id} className="flex items-start gap-3 p-3 bg-stone-50 rounded-xl">
                  <div className="w-16 h-16 rounded-lg bg-stone-200 overflow-hidden shrink-0">
                    {item.image_url ? (
                      <Image
                        src={getProductImage(item.model_name, item.image_url)}
                        alt={item.model_name}
                        width={64}
                        height={64}
                        sizes={PRODUCT_IMAGE_SIZES.thumb}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-stone-300 text-xs">IMG</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-stone-800">{item.model_name}</p>
                    <p className="text-xs text-stone-400 mt-0.5">{item.category}</p>
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1.5 text-xs text-stone-500">
                      {isSofaCategory(item.category) && item.sofa_configuration && <span>Config: <strong>{item.sofa_configuration}</strong></span>}
                      {item.color && <span>Color: <strong>{item.color}</strong></span>}
                      <span>Qty: <strong>{item.quantity}</strong></span>
                    </div>
                    {item.customization_note && <p className="text-xs text-stone-600 bg-amber-50 border border-amber-100 rounded px-2 py-1 mt-2 italic">📝 {item.customization_note}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5">
            <h2 className="font-semibold text-stone-800 mb-4">Activity Timeline</h2>
            <OrderTimeline history={history} />
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5">
            <h2 className="font-semibold text-stone-800 mb-3">Customer</h2>
            {order.customer ? (
              <div className="space-y-1 text-sm">
                <p className="font-semibold text-stone-800">{order.customer.name}</p>
                {order.customer.phone && <p className="text-stone-500">📞 {order.customer.phone}</p>}
                {order.customer.address && <p className="text-stone-500">📍 {order.customer.address}, {order.customer.city}</p>}
              </div>
            ) : <p className="text-stone-400 text-sm">No customer linked</p>}
          </div>

          {/* Remaining balance only — no full financial breakdown */}
          <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5">
            <h2 className="font-semibold text-stone-800 mb-3">Remaining Balance</h2>
            <p className={`text-2xl font-bold ${trueRemaining > 0 ? 'text-orange-600' : 'text-green-600'}`}>
              {formatCurrency(trueRemaining)}
            </p>
          </div>

          {(order.expected_delivery_date || order.delivery_address) && (
            <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5">
              <h2 className="font-semibold text-stone-800 mb-3">Delivery</h2>
              <div className="space-y-1 text-sm">
                {order.expected_delivery_date && <div className="flex justify-between"><span className="text-stone-500">Expected</span><span className="text-stone-700">{formatDate(order.expected_delivery_date)}</span></div>}
                {order.delivery_address && <p className="text-stone-500">📍 {order.delivery_address}</p>}
              </div>
            </div>
          )}

          {order.factory_notes && (
            <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5">
              <h2 className="font-semibold text-stone-800 mb-3">Factory Notes</h2>
              <p className="text-sm text-stone-700">{order.factory_notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
