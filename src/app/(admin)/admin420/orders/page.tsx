'use client'

import { useDeferredValue, useEffect, useState, useCallback, useMemo, useTransition } from 'react'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DeliveryStatusBadge, PaymentStatusBadge } from '@/components/orders/StatusBadge'
import { formatCurrency, formatDate } from '@/lib/utils'
import { DELIVERY_STATUSES, PAYMENT_STATUSES } from '@/lib/constants'
import { Plus, Search, ShoppingBag, Download, Trash2, RotateCcw, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { restoreOrder, bulkDeleteOrders, updateDeliveryStatus } from '@/actions/orders'
import { toast } from 'sonner'
import type { DeliveryStatus, Order } from '@/types'

type OrderWithPayments = Order & { payments: { amount: number }[] }

function trueRemaining(order: OrderWithPayments): number {
  const paidSum = order.payments.reduce((s, p) => s + p.amount, 0)
  return Math.max(0, order.remaining_balance - paidSum)
}

function exportCSV(orders: OrderWithPayments[]) {
  const header = ['Order #', 'Order Date', 'Customer Name', 'Customer Phone', 'Customer Address', 'Delivery Date', 'Source', 'Total (€)', 'Down Payment (€)', 'Remaining (€)']
  const rows = orders.map(o => [
    o.order_number,
    o.order_date ?? '',
    o.customer?.name ?? '',
    o.customer?.phone ?? '',
    o.customer?.address ?? '',
    o.expected_delivery_date ?? '',
    o.order_source ?? '',
    o.total_price.toFixed(2),
    o.down_payment.toFixed(2),
    trueRemaining(o).toFixed(2),
  ])
  const csv = [header, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `orders-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export default function AdminOrdersPage() {
  const [activeTab, setActiveTab] = useState<'active' | 'deleted'>('active')
  const [orders, setOrders] = useState<OrderWithPayments[]>([])
  const [deletedOrders, setDeletedOrders] = useState<OrderWithPayments[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [paymentFilter, setPaymentFilter] = useState('')
  const [visibleCount, setVisibleCount] = useState(50)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [deleteModal, setDeleteModal] = useState(false)
  const [singleDeleteId, setSingleDeleteId] = useState<string | null>(null)
  const [updatingDeliveryId, setUpdatingDeliveryId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [isDeleting, startDeleteTransition] = useTransition()
  const deferredSearch = useDeferredValue(search)

  const fetchOrders = useCallback(async () => {
    const supabase = getSupabaseBrowserClient()
    const [activeRes, deletedRes] = await Promise.all([
      supabase
        .from('orders')
        .select('id, order_number, order_date, expected_delivery_date, total_price, down_payment, remaining_balance, payment_status, order_status, delivery_status, order_source, created_at, deleted_at, customer:customers(name, phone, address), payments(amount)')
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(500),
      supabase
        .from('orders')
        .select('id, order_number, order_date, expected_delivery_date, total_price, down_payment, remaining_balance, payment_status, order_status, delivery_status, order_source, created_at, deleted_at, customer:customers(name, phone, address), payments(amount)')
        .not('deleted_at', 'is', null)
        .order('deleted_at', { ascending: false })
        .limit(500),
    ])
    setOrders((activeRes.data as OrderWithPayments[]) ?? [])
    setDeletedOrders((deletedRes.data as OrderWithPayments[]) ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchOrders() }, [fetchOrders])

  useEffect(() => {
    setVisibleCount(50)
    setSelected(new Set())
  }, [deferredSearch, statusFilter, paymentFilter, activeTab])

  const sourceList = activeTab === 'deleted' ? deletedOrders : orders

  const filtered = useMemo(() => sourceList.filter(o => {
    const matchSearch = !deferredSearch ||
      o.order_number.toLowerCase().includes(deferredSearch.toLowerCase()) ||
      (o.customer?.name ?? '').toLowerCase().includes(deferredSearch.toLowerCase()) ||
      (o.customer?.phone ?? '').includes(deferredSearch)
    const matchStatus = !statusFilter || o.delivery_status === statusFilter
    const matchPayment = !paymentFilter || o.payment_status === paymentFilter
    return matchSearch && matchStatus && matchPayment
  }), [sourceList, deferredSearch, statusFilter, paymentFilter])

  const visibleOrders = filtered.slice(0, visibleCount)

  const allVisibleSelected = visibleOrders.length > 0 && visibleOrders.every(o => selected.has(o.id))

  function toggleSelectAll() {
    if (allVisibleSelected) {
      setSelected(prev => {
        const next = new Set(prev)
        visibleOrders.forEach(o => next.delete(o.id))
        return next
      })
    } else {
      setSelected(prev => {
        const next = new Set(prev)
        visibleOrders.forEach(o => next.add(o.id))
        return next
      })
    }
  }

  function toggleSelect(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function handleDeliveryStatusChange(orderId: string, status: DeliveryStatus) {
    const order = orders.find(o => o.id === orderId)
    if (!order || order.delivery_status === status) return

    setUpdatingDeliveryId(orderId)
    const result = await updateDeliveryStatus(orderId, status)
    setUpdatingDeliveryId(null)

    if (result.error) {
      toast.error(result.error)
      return
    }

    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, delivery_status: status } : o))
    toast.success('Delivery status updated')
  }

  async function handleSingleDelete() {
    if (!singleDeleteId) return
    startDeleteTransition(async () => {
      const result = await bulkDeleteOrders([singleDeleteId])
      if (result.error) { toast.error(result.error); return }
      toast.success('Order deleted')
      setSingleDeleteId(null)
      await fetchOrders()
    })
  }

  async function handleBulkDelete() {
    startDeleteTransition(async () => {
      const result = await bulkDeleteOrders([...selected])
      if (result.error) { toast.error(result.error); return }
      toast.success(`${selected.size} order${selected.size > 1 ? 's' : ''} deleted`)
      setSelected(new Set())
      setDeleteModal(false)
      await fetchOrders()
    })
  }

  async function handleRestore(orderId: string) {
    startTransition(async () => {
      const result = await restoreOrder(orderId)
      if (result.error) { toast.error(result.error); return }
      toast.success('Order restored')
      await fetchOrders()
    })
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Orders</h1>
          <p className="text-stone-500 text-sm mt-1">{orders.length} active · {deletedOrders.length} deleted</p>
        </div>
        <div className="flex gap-2">
          {activeTab === 'active' && (
            <Button variant="outline" onClick={() => exportCSV(filtered)} title="Export to CSV">
              <Download className="w-4 h-4 mr-2" /> Export CSV
            </Button>
          )}
          <Link href="/admin420/orders/new">
            <Button className="bg-stone-900 hover:bg-stone-800">
              <Plus className="w-4 h-4 mr-2" /> New Order
            </Button>
          </Link>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-stone-200">
        <button
          onClick={() => setActiveTab('active')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'active' ? 'border-stone-900 text-stone-900' : 'border-transparent text-stone-500 hover:text-stone-700'}`}
        >
          Active ({orders.length})
        </button>
        <button
          onClick={() => setActiveTab('deleted')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 ${activeTab === 'deleted' ? 'border-red-600 text-red-700' : 'border-transparent text-stone-500 hover:text-stone-700'}`}
        >
          <Trash2 className="w-3.5 h-3.5" />
          Deleted ({deletedOrders.length})
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <Input placeholder="Search by order # or customer..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="h-10 px-3 border border-stone-200 rounded-lg text-sm text-stone-700 bg-white focus:outline-none focus:ring-2 focus:ring-stone-300" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          {DELIVERY_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <select className="h-10 px-3 border border-stone-200 rounded-lg text-sm text-stone-700 bg-white focus:outline-none focus:ring-2 focus:ring-stone-300" value={paymentFilter} onChange={e => setPaymentFilter(e.target.value)}>
          <option value="">All Payments</option>
          {PAYMENT_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && activeTab === 'active' && (
        <div className="flex items-center gap-3 bg-stone-900 text-white rounded-xl px-4 py-3">
          <span className="text-sm font-medium">{selected.size} order{selected.size > 1 ? 's' : ''} selected</span>
          <div className="flex-1" />
          <Button
            size="sm"
            variant="outline"
            onClick={() => setSelected(new Set())}
            className="border-stone-600 text-stone-300 hover:text-white hover:bg-stone-800"
          >
            Clear
          </Button>
          <Button
            size="sm"
            onClick={() => setDeleteModal(true)}
            className="bg-red-600 hover:bg-red-700 text-white border-0"
          >
            <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Delete Selected
          </Button>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-stone-100 overflow-hidden">
        {loading ? (
          <div className="divide-y divide-stone-50">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="px-6 py-4 animate-pulse flex items-center gap-4">
                <div className="w-4 h-4 bg-stone-200 rounded" />
                <div className="w-16 h-5 bg-stone-200 rounded" />
                <div className="flex-1 space-y-1.5"><div className="h-4 bg-stone-200 rounded w-1/3" /><div className="h-3 bg-stone-100 rounded w-1/4" /></div>
                <div className="w-20 h-6 bg-stone-100 rounded-full" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-stone-400">
            <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">{activeTab === 'deleted' ? 'No deleted orders' : 'No orders found'}</p>
            {activeTab === 'active' && orders.length === 0 && <p className="text-sm mt-1"><Link href="/admin420/orders/new" className="text-stone-600 underline">Create your first order</Link></p>}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-100 bg-stone-50">
                  {activeTab === 'active' && (
                    <th className="px-4 py-3 w-8">
                      <input
                        type="checkbox"
                        checked={allVisibleSelected}
                        onChange={toggleSelectAll}
                        className="rounded border-stone-300 accent-stone-800"
                      />
                    </th>
                  )}
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
                  <tr
                    key={order.id}
                    className={`hover:bg-stone-50 transition-colors ${activeTab === 'deleted' ? 'opacity-70' : ''} ${selected.has(order.id) ? 'bg-stone-50' : ''}`}
                  >
                    {activeTab === 'active' && (
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selected.has(order.id)}
                          onChange={() => toggleSelect(order.id)}
                          className="rounded border-stone-300 accent-stone-800"
                        />
                      </td>
                    )}
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
                    <td className="px-4 py-3">
                      {activeTab === 'deleted' ? (
                        <DeliveryStatusBadge status={order.delivery_status ?? 'not_scheduled'} />
                      ) : (
                        <select
                          className="h-8 min-w-36 rounded-lg border border-stone-200 bg-white px-2 text-xs font-medium text-stone-700 focus:outline-none focus:ring-2 focus:ring-stone-300 disabled:cursor-not-allowed disabled:opacity-60"
                          value={order.delivery_status ?? 'not_scheduled'}
                          onChange={e => handleDeliveryStatusChange(order.id, e.target.value as DeliveryStatus)}
                          disabled={updatingDeliveryId === order.id}
                          aria-label={`Delivery status for order ${order.order_number}`}
                        >
                          {DELIVERY_STATUSES.map(s => (
                            <option key={s.value} value={s.value}>{s.label}</option>
                          ))}
                        </select>
                      )}
                    </td>
                    <td className="px-4 py-3"><PaymentStatusBadge status={order.payment_status} /></td>
                    <td className="px-4 py-3">
                      {activeTab === 'deleted' ? (
                        <button
                          onClick={() => handleRestore(order.id)}
                          disabled={isPending}
                          className="flex items-center gap-1 text-xs font-medium text-emerald-700 hover:text-emerald-900 disabled:opacity-50"
                        >
                          <RotateCcw className="w-3.5 h-3.5" /> Restore
                        </button>
                      ) : (
                        <div className="flex items-center gap-3">
                          <Link href={`/admin420/orders/${order.id}`} className="text-stone-500 hover:text-stone-900 text-xs font-medium">View →</Link>
                          <button
                            onClick={() => setSingleDeleteId(order.id)}
                            className="text-red-400 hover:text-red-600 transition-colors"
                            title="Delete order"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
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

      {/* Single order delete confirmation dialog */}
      <Dialog open={!!singleDeleteId} onOpenChange={open => { if (!open) setSingleDeleteId(null) }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete this order?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-stone-500 mt-1">The order will be moved to the Deleted folder. You can restore it later.</p>
          <div className="flex gap-3 mt-4">
            <Button variant="outline" className="flex-1" onClick={() => setSingleDeleteId(null)} disabled={isDeleting}>Cancel</Button>
            <Button className="flex-1 bg-red-600 hover:bg-red-700 text-white" onClick={handleSingleDelete} disabled={isDeleting}>
              {isDeleting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk delete confirmation dialog */}
      <Dialog open={deleteModal} onOpenChange={setDeleteModal}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete {selected.size} order{selected.size > 1 ? 's' : ''}?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-stone-500 mt-1">
            {selected.size > 1
              ? `These ${selected.size} orders will be moved to the Deleted folder. You can restore them later.`
              : 'This order will be moved to the Deleted folder. You can restore it later.'}
          </p>
          <div className="flex gap-3 mt-4">
            <Button variant="outline" className="flex-1" onClick={() => setDeleteModal(false)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              onClick={handleBulkDelete}
              disabled={isDeleting}
            >
              {isDeleting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
