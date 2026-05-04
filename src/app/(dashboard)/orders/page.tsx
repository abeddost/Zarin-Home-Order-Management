'use client'

import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { OrderStatusBadge, PaymentStatusBadge } from '@/components/orders/StatusBadge'
import { formatCurrency, formatDate } from '@/lib/utils'
import { ORDER_STATUSES, PAYMENT_STATUSES } from '@/lib/constants'
import { Plus, Search, ShoppingBag } from 'lucide-react'
import Link from 'next/link'
import type { Order } from '@/types'

type OrderWithPayments = Order & { payments: { amount: number }[] }

function trueRemaining(order: OrderWithPayments): number {
  const paidSum = order.payments.reduce((s, p) => s + p.amount, 0)
  return Math.max(0, order.remaining_balance - paidSum)
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderWithPayments[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [paymentFilter, setPaymentFilter] = useState('')
  const [visibleCount, setVisibleCount] = useState(50)
  const deferredSearch = useDeferredValue(search)

  async function fetchOrders() {
    const supabase = getSupabaseBrowserClient()
    const { data } = await supabase
      .from('orders')
      .select('id, order_number, order_date, total_price, down_payment, remaining_balance, payment_status, order_status, order_source, created_at, customer:customers(name, phone), payments(amount)')
      .order('created_at', { ascending: false })
      .limit(200)
    setOrders((data as OrderWithPayments[]) ?? [])
    setLoading(false)
  }

  useEffect(() => { fetchOrders() }, [])

  useEffect(() => { setVisibleCount(50) }, [deferredSearch, statusFilter, paymentFilter])

  const filtered = useMemo(() => orders.filter(o => {
    const matchSearch = !deferredSearch ||
      o.order_number.toLowerCase().includes(deferredSearch.toLowerCase()) ||
      (o.customer?.name ?? '').toLowerCase().includes(deferredSearch.toLowerCase()) ||
      (o.customer?.phone ?? '').includes(deferredSearch)
    const matchStatus = !statusFilter || o.order_status === statusFilter
    const matchPayment = !paymentFilter || o.payment_status === paymentFilter
    return matchSearch && matchStatus && matchPayment
  }), [orders, deferredSearch, statusFilter, paymentFilter])

  const visibleOrders = filtered.slice(0, visibleCount)

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Orders</h1>
          <p className="text-stone-500 text-sm mt-1">{orders.length} total orders</p>
        </div>
        <Link href="/orders/new">
          <Button className="bg-stone-900 hover:bg-stone-800">
            <Plus className="w-4 h-4 mr-2" /> New Order
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <Input
            placeholder="Search by order # or customer..."
            className="pl-9"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select
          className="h-10 px-3 border border-stone-200 rounded-lg text-sm text-stone-700 bg-white focus:outline-none focus:ring-2 focus:ring-stone-300"
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
        >
          <option value="">All Statuses</option>
          {ORDER_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <select
          className="h-10 px-3 border border-stone-200 rounded-lg text-sm text-stone-700 bg-white focus:outline-none focus:ring-2 focus:ring-stone-300"
          value={paymentFilter}
          onChange={e => setPaymentFilter(e.target.value)}
        >
          <option value="">All Payments</option>
          {PAYMENT_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-stone-100 overflow-hidden">
        {loading ? (
          <div className="divide-y divide-stone-50">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="px-6 py-4 animate-pulse flex items-center gap-4">
                <div className="w-16 h-5 bg-stone-200 rounded" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-4 bg-stone-200 rounded w-1/3" />
                  <div className="h-3 bg-stone-100 rounded w-1/4" />
                </div>
                <div className="w-20 h-6 bg-stone-100 rounded-full" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-stone-400">
            <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No orders found</p>
            {orders.length === 0 && (
              <p className="text-sm mt-1">
                <Link href="/orders/new" className="text-stone-600 underline">Create your first order</Link>
              </p>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-100 bg-stone-50">
                  <th className="text-left px-4 py-3 font-medium text-stone-500">Order #</th>
                  <th className="text-left px-4 py-3 font-medium text-stone-500">Date</th>
                  <th className="text-left px-4 py-3 font-medium text-stone-500">Customer</th>
                  <th className="text-left px-4 py-3 font-medium text-stone-500">Total</th>
                  <th className="text-left px-4 py-3 font-medium text-stone-500">Remaining</th>
                  <th className="text-left px-4 py-3 font-medium text-stone-500">Source</th>
                  <th className="text-left px-4 py-3 font-medium text-stone-500">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-stone-500">Payment</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50">
                {visibleOrders.map(order => (
                  <tr key={order.id} className="hover:bg-stone-50 transition-colors">
                    <td className="px-4 py-3 font-mono font-semibold text-stone-800">#{order.order_number}</td>
                    <td className="px-4 py-3 text-stone-600">{formatDate(order.order_date)}</td>
                    <td className="px-4 py-3 text-stone-800 font-medium">{order.customer?.name ?? '—'}</td>
                    <td className="px-4 py-3 font-medium text-stone-800">{formatCurrency(order.total_price)}</td>
                    <td className="px-4 py-3 text-stone-600">{formatCurrency(trueRemaining(order))}</td>
                    <td className="px-4 py-3">
                      {order.order_source ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-stone-100 text-stone-600">
                          {order.order_source === 'turkey' ? 'Turkey' : 'Depot'}
                        </span>
                      ) : <span className="text-stone-300 text-xs">—</span>}
                    </td>
                    <td className="px-4 py-3"><OrderStatusBadge status={order.order_status} /></td>
                    <td className="px-4 py-3"><PaymentStatusBadge status={order.payment_status} /></td>
                    <td className="px-4 py-3">
                      <Link href={`/orders/${order.id}`} className="text-stone-500 hover:text-stone-900 text-xs font-medium">
                        View →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {!loading && visibleOrders.length < filtered.length && (
        <div className="flex justify-center">
          <Button variant="outline" onClick={() => setVisibleCount(c => c + 50)}>
            Load more orders
          </Button>
        </div>
      )}
    </div>
  )
}
