import { getSupabaseServerClient } from '@/lib/supabase/server'
import { StatsCard } from '@/components/dashboard/StatsCard'
import { formatCurrency, formatDate } from '@/lib/utils'
import { OrderStatusBadge, PaymentStatusBadge } from '@/components/orders/StatusBadge'
import Link from 'next/link'
import {
  ShoppingBag, Factory, Truck, CheckCircle, XCircle,
  CreditCard, AlertCircle, DollarSign, TrendingUp, Clock,
  Package, BarChart3,
} from 'lucide-react'
import type { Order } from '@/types'

export default async function AdminDashboardPage() {
  const supabase = await getSupabaseServerClient()

  const [ordersResult, recentResult] = await Promise.all([
    supabase.from('orders').select('order_status, payment_status, total_price, down_payment, remaining_balance'),
    supabase.from('orders').select('id, order_number, order_date, total_price, order_status, payment_status, created_at, customer:customers(name, phone)').order('created_at', { ascending: false }).limit(10),
  ])

  const orders = ordersResult.data ?? []
  const recentOrders = (recentResult.data ?? []) as unknown as Order[]

  const stats = {
    total:             orders.length,
    draft:             orders.filter(o => o.order_status === 'draft').length,
    sentToFactory:     orders.filter(o => o.order_status === 'sent_to_factory').length,
    inProduction:      orders.filter(o => o.order_status === 'in_production').length,
    ready:             orders.filter(o => o.order_status === 'ready').length,
    scheduled:         orders.filter(o => o.order_status === 'scheduled_for_delivery').length,
    delivered:         orders.filter(o => o.order_status === 'delivered').length,
    completed:         orders.filter(o => o.order_status === 'completed').length,
    cancelled:         orders.filter(o => o.order_status === 'cancelled').length,
    unpaid:            orders.filter(o => o.payment_status === 'unpaid').length,
    partiallyPaid:     orders.filter(o => o.payment_status === 'partially_paid').length,
    paid:              orders.filter(o => o.payment_status === 'paid').length,
    totalRevenue:      orders.reduce((s, o) => s + (o.total_price ?? 0), 0),
    totalDownPayments: orders.reduce((s, o) => s + (o.down_payment ?? 0), 0),
    totalRemaining:    orders.reduce((s, o) => s + (o.remaining_balance ?? 0), 0),
  }

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-stone-900">Dashboard</h1>
        <p className="text-stone-500 text-sm mt-1">Overview of all orders and business performance</p>
      </div>
      <div>
        <h2 className="text-sm font-semibold text-stone-500 uppercase tracking-wide mb-3">Financial Summary</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatsCard title="Total Revenue" value={formatCurrency(stats.totalRevenue)} icon={TrendingUp} color="text-emerald-600" />
          <StatsCard title="Down Payments" value={formatCurrency(stats.totalDownPayments)} icon={DollarSign} color="text-blue-600" />
          <StatsCard title="Remaining" value={formatCurrency(stats.totalRemaining)} icon={AlertCircle} color="text-orange-600" />
        </div>
      </div>
      <div>
        <h2 className="text-sm font-semibold text-stone-500 uppercase tracking-wide mb-3">Order Status</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <StatsCard title="All Orders" value={stats.total} icon={ShoppingBag} />
          <StatsCard title="Draft" value={stats.draft} icon={Clock} color="text-gray-500" />
          <StatsCard title="At Factory" value={stats.sentToFactory + stats.inProduction} icon={Factory} color="text-yellow-600" />
          <StatsCard title="Ready" value={stats.ready} icon={Package} color="text-emerald-600" />
          <StatsCard title="In Delivery" value={stats.scheduled} icon={Truck} color="text-cyan-600" />
          <StatsCard title="Delivered" value={stats.delivered} icon={CheckCircle} color="text-green-600" />
          <StatsCard title="Completed" value={stats.completed} icon={BarChart3} color="text-green-700" />
          <StatsCard title="Cancelled" value={stats.cancelled} icon={XCircle} color="text-red-500" />
        </div>
      </div>
      <div>
        <h2 className="text-sm font-semibold text-stone-500 uppercase tracking-wide mb-3">Payment Status</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatsCard title="Unpaid" value={stats.unpaid} icon={AlertCircle} color="text-red-500" />
          <StatsCard title="Partially Paid" value={stats.partiallyPaid} icon={CreditCard} color="text-orange-500" />
          <StatsCard title="Fully Paid" value={stats.paid} icon={CheckCircle} color="text-green-600" />
        </div>
      </div>
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-stone-500 uppercase tracking-wide">Recent Orders</h2>
          <Link href="/admin420/orders" className="text-sm text-stone-600 hover:text-stone-900 font-medium">View all →</Link>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-stone-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-100 bg-stone-50">
                  <th className="text-left px-4 py-3 font-medium text-stone-500">Order #</th>
                  <th className="text-left px-4 py-3 font-medium text-stone-500">Date</th>
                  <th className="text-left px-4 py-3 font-medium text-stone-500">Customer</th>
                  <th className="text-left px-4 py-3 font-medium text-stone-500">Total</th>
                  <th className="text-left px-4 py-3 font-medium text-stone-500">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-stone-500">Payment</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50">
                {recentOrders.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-stone-400">No orders yet. <Link href="/admin420/orders/new" className="text-stone-600 underline">Create your first order</Link></td></tr>
                ) : recentOrders.map(order => (
                  <tr key={order.id} className="hover:bg-stone-50 transition-colors">
                    <td className="px-4 py-3 font-mono font-semibold text-stone-800">#{order.order_number}</td>
                    <td className="px-4 py-3 text-stone-600">{formatDate(order.order_date)}</td>
                    <td className="px-4 py-3 text-stone-800">{order.customer?.name ?? '—'}</td>
                    <td className="px-4 py-3 font-medium text-stone-800">{formatCurrency(order.total_price)}</td>
                    <td className="px-4 py-3"><OrderStatusBadge status={order.order_status} /></td>
                    <td className="px-4 py-3"><PaymentStatusBadge status={order.payment_status} /></td>
                    <td className="px-4 py-3"><Link href={`/admin420/orders/${order.id}`} className="text-stone-500 hover:text-stone-900 text-xs font-medium">View →</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
