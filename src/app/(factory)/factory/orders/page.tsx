'use client'

import { useEffect, useState } from 'react'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { OrderStatusBadge, FactoryStatusBadge, DeliveryStatusBadge } from '@/components/orders/StatusBadge'
import { formatDate } from '@/lib/utils'
import { ORDER_STATUSES } from '@/lib/constants'
import { Search, ShoppingBag } from 'lucide-react'
import Link from 'next/link'
import type { Order } from '@/types'

export default function FactoryOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  useEffect(() => {
    async function fetch() {
      const supabase = getSupabaseBrowserClient()
      const { data } = await supabase
        .from('orders')
        .select('id, order_number, order_date, order_status, factory_status, delivery_status, created_at, customer:customers(name, phone)')
        .order('created_at', { ascending: false })
        .limit(200)
      setOrders((data as Order[]) ?? [])
      setLoading(false)
    }
    fetch()
  }, [])

  const filtered = orders.filter(o => {
    const matchSearch = !search ||
      o.order_number.toLowerCase().includes(search.toLowerCase()) ||
      (o.customer?.name ?? '').toLowerCase().includes(search.toLowerCase())
    const matchStatus = !statusFilter || o.order_status === statusFilter
    return matchSearch && matchStatus
  })

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-stone-900">Orders</h1>
        <p className="text-stone-500 text-sm mt-1">{orders.length} total orders</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <Input placeholder="Search by order # or customer..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="h-10 px-3 border border-stone-200 rounded-lg text-sm text-stone-700 bg-white focus:outline-none focus:ring-2 focus:ring-stone-300" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          {ORDER_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-stone-100 overflow-hidden">
        {loading ? (
          <div className="divide-y divide-stone-50">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="px-6 py-4 animate-pulse flex items-center gap-4">
                <div className="w-16 h-5 bg-stone-200 rounded" />
                <div className="flex-1 space-y-1.5"><div className="h-4 bg-stone-200 rounded w-1/3" /></div>
                <div className="w-20 h-6 bg-stone-100 rounded-full" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-stone-400">
            <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No orders found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-100 bg-stone-50">
                  <th className="text-left px-4 py-3 font-medium text-stone-500">Order #</th>
                  <th className="text-left px-4 py-3 font-medium text-stone-500">Date</th>
                  <th className="text-left px-4 py-3 font-medium text-stone-500">Customer</th>
                  <th className="text-left px-4 py-3 font-medium text-stone-500">Order Status</th>
                  <th className="text-left px-4 py-3 font-medium text-stone-500">Factory Status</th>
                  <th className="text-left px-4 py-3 font-medium text-stone-500">Delivery</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50">
                {filtered.map(order => (
                  <tr key={order.id} className="hover:bg-stone-50 transition-colors">
                    <td className="px-4 py-3 font-mono font-semibold text-stone-800">#{order.order_number}</td>
                    <td className="px-4 py-3 text-stone-600">{formatDate(order.order_date)}</td>
                    <td className="px-4 py-3 text-stone-800 font-medium">{order.customer?.name ?? '—'}</td>
                    <td className="px-4 py-3"><OrderStatusBadge status={order.order_status} /></td>
                    <td className="px-4 py-3"><FactoryStatusBadge status={order.factory_status ?? 'not_sent'} /></td>
                    <td className="px-4 py-3"><DeliveryStatusBadge status={order.delivery_status ?? 'not_scheduled'} /></td>
                    <td className="px-4 py-3">
                      <Link href={`/factory/orders/${order.id}`} className="text-stone-500 hover:text-stone-900 text-xs font-medium">View →</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
