import { getSupabaseServerClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ChevronLeft, FileText, CreditCard, Factory, Truck, Package, Pencil } from 'lucide-react'
import { OrderStatusBadge, FactoryStatusBadge, DeliveryStatusBadge, PaymentStatusBadge } from '@/components/orders/StatusBadge'
import { OrderTimeline } from '@/components/orders/OrderTimeline'
import { OrderDetailActions } from '@/components/orders/OrderDetailActions'
import { PaymentHistorySection } from '@/components/orders/PaymentHistorySection'
import { formatCurrency, formatDate, isSofaCategory } from '@/lib/utils'
import { getProductImage } from '@/lib/productImages'
import type { Order, Payment, OrderStatusHistory } from '@/types'

interface Props { params: Promise<{ id: string }> }

export default async function AdminOrderDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await getSupabaseServerClient()

  const [orderResult, paymentsResult, historyResult] = await Promise.all([
    supabase.from('orders').select('*, customer:customers(*), order_items(*)').eq('id', id).single(),
    supabase.from('payments').select('*').eq('order_id', id).order('payment_date', { ascending: true }),
    supabase.from('order_status_history').select('*').eq('order_id', id).order('created_at', { ascending: true }),
  ])

  if (orderResult.error || !orderResult.data) notFound()

  const order = orderResult.data as Order
  const payments = (paymentsResult.data ?? []) as Payment[]
  const history = (historyResult.data ?? []) as OrderStatusHistory[]
  const paidSum = payments.reduce((s, p) => s + p.amount, 0)
  const trueRemaining = Math.max(0, order.remaining_balance - paidSum)

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <Link href="/admin420/orders" className="inline-flex items-center gap-1 text-sm text-stone-500 hover:text-stone-800 mb-3">
          <ChevronLeft className="w-4 h-4" /> Back to Orders
        </Link>
        <div className="flex flex-wrap items-start gap-4 justify-between">
          <div>
            <h1 className="text-2xl font-bold text-stone-900 font-mono">Order #{order.order_number}</h1>
            <p className="text-stone-500 text-sm mt-1">Created {formatDate(order.created_at)} · Order date: {formatDate(order.order_date)}</p>
          </div>
          <div className="flex items-center gap-2">
            <Link href={`/admin420/orders/${order.id}/edit`} className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 border border-stone-200 rounded-lg hover:bg-stone-50 text-stone-600 hover:text-stone-900 transition-colors">
              <Pencil className="w-3.5 h-3.5" /> Edit Order
            </Link>
            <OrderDetailActions order={order} trueRemaining={trueRemaining} showDelete showFactoryPDF />
          </div>
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
        <div className="flex items-center gap-2 bg-white border border-stone-100 rounded-xl px-4 py-2.5">
          <CreditCard className="w-4 h-4 text-stone-400" />
          <span className="text-xs text-stone-400 mr-1">Payment</span>
          <PaymentStatusBadge status={order.payment_status} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5">
            <h2 className="font-semibold text-stone-800 mb-4">Order Items</h2>
            <div className="space-y-3">
              {(order.order_items ?? []).map(item => (
                <div key={item.id} className="flex items-start gap-3 p-3 bg-stone-50 rounded-xl">
                  <div className="w-16 h-16 rounded-lg bg-stone-200 overflow-hidden shrink-0">
                    {item.image_url ? (
                      <Image src={getProductImage(item.model_name, item.image_url)} alt={item.model_name} width={64} height={64} className="object-cover w-full h-full" unoptimized />
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
                      <span>Price: <strong>{formatCurrency(item.unit_price)}</strong></span>
                    </div>
                    {item.customization_note && <p className="text-xs text-stone-600 bg-amber-50 border border-amber-100 rounded px-2 py-1 mt-2 italic">📝 {item.customization_note}</p>}
                  </div>
                  <p className="text-sm font-bold text-stone-800 shrink-0">{formatCurrency(item.unit_price * item.quantity)}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5">
            <h2 className="font-semibold text-stone-800 mb-4">Payment History</h2>
            <PaymentHistorySection payments={payments} orderId={order.id} downPayment={order.down_payment} orderDate={order.order_date} paidSum={paidSum} />
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
                {order.customer.email && <p className="text-stone-500">✉️ {order.customer.email}</p>}
                {order.customer.address && <p className="text-stone-500">📍 {order.customer.address}, {order.customer.city}</p>}
              </div>
            ) : <p className="text-stone-400 text-sm">No customer linked</p>}
          </div>

          <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5">
            <h2 className="font-semibold text-stone-800 mb-3">Financial Summary</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-stone-500">Total Price</span><span className="font-semibold text-stone-800">{formatCurrency(order.total_price)}</span></div>
              <div className="flex justify-between"><span className="text-stone-500">Down Payment</span><span className="font-semibold text-blue-700">{formatCurrency(order.down_payment)}</span></div>
              {paidSum > 0 && <div className="flex justify-between"><span className="text-stone-500">Additional Payments</span><span className="font-semibold text-blue-600">{formatCurrency(paidSum)}</span></div>}
              <div className="flex justify-between pt-2 border-t border-stone-100">
                <span className="text-stone-500 font-medium">Remaining Balance</span>
                <span className={`font-bold ${trueRemaining > 0 ? 'text-orange-600' : 'text-green-600'}`}>{formatCurrency(trueRemaining)}</span>
              </div>
              {order.payment_method && <div className="flex justify-between pt-1"><span className="text-stone-400 text-xs">Method</span><span className="text-stone-600 text-xs">{order.payment_method}</span></div>}
            </div>
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

          {(order.factory_notes || order.internal_notes) && (
            <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5">
              <h2 className="font-semibold text-stone-800 mb-3">Notes</h2>
              {order.factory_notes && <div className="mb-2"><p className="text-xs text-stone-400 mb-1">Factory Notes</p><p className="text-sm text-stone-700">{order.factory_notes}</p></div>}
              {order.internal_notes && <div><p className="text-xs text-stone-400 mb-1">Internal Notes</p><p className="text-sm text-stone-500 italic">{order.internal_notes}</p></div>}
            </div>
          )}

          <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5">
            <h2 className="font-semibold text-stone-800 mb-3 flex items-center gap-2"><FileText className="w-4 h-4" /> Customer PDF</h2>
            {order.pdf_url ? (
              <a href={order.pdf_url} target="_blank" rel="noopener noreferrer" className="text-sm text-stone-600 underline hover:text-stone-900">Download PDF →</a>
            ) : (
              <p className="text-stone-400 text-sm">No PDF generated yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
