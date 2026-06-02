'use client'

import { useDeferredValue, useEffect, useState, useCallback, useMemo, useTransition } from 'react'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DeliveryStatusBadge } from '@/components/orders/StatusBadge'
import { cn, formatCurrency, formatDate } from '@/lib/utils'
import { DELIVERY_STATUSES } from '@/lib/constants'
import { Plus, Search, Store, Download, Trash2, RotateCcw, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { restoreOrder, bulkDeleteOrders, updateDeliveryStatus } from '@/actions/orders'
import { toast } from 'sonner'
import type { DeliveryStatus, Order, OrderItem } from '@/types'

type ShowroomOrder = Order & { order_items: OrderItem[]; payments: { amount: number }[] }

function computeCosts(order: ShowroomOrder) {
  const items = order.order_items ?? []
  const totalProduct = items.reduce((s, i) => s + (i.product_cost ?? 0) * i.quantity, 0)
  const totalLogistics = items.reduce((s, i) => s + (i.logistics_cost ?? 0) * i.quantity, 0)
  const grandTotal = totalProduct + totalLogistics
  const paidSum = (order.payments ?? []).reduce((s, p) => s + p.amount, 0)
  const remaining = Math.max(0, grandTotal - paidSum)
  return { totalProduct, totalLogistics, grandTotal, paidSum, remaining }
}

function deliveryStatusSelectClass(status: DeliveryStatus | null | undefined): string {
  return cn(
    'h-8 min-w-36 rounded-lg border px-2 text-xs font-medium focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60',
    status === 'delivered'
      ? 'border-green-200 bg-green-100 text-green-700 focus:ring-green-200'
      : 'border-stone-200 bg-white text-stone-700 focus:ring-stone-300'
  )
}

function exportCSV(orders: ShowroomOrder[]) {
  const header = ['Order #', 'Order Date', 'Items', 'Cost (€)', 'Paid (€)', 'Remaining (€)', 'Delivery Status']
  const rows = orders.map(o => {
    const { grandTotal, paidSum, remaining } = computeCosts(o)
    const itemSummary = (o.order_items ?? []).map(i => `${i.model_name} x${i.quantity}`).join('; ')
    return [
      o.order_number,
      o.order_date ?? '',
      itemSummary,
      grandTotal.toFixed(2),
      paidSum.toFixed(2),
      remaining.toFixed(2),
      o.delivery_status ?? '',
    ]
  })
  const csv = [header, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `showroom-orders-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export default function ShowRoomOrdersPage() {
  const [activeTab, setActiveTab] = useState<'active' | 'deleted'>('active')
  const [orders, setOrders] = useState<ShowroomOrder[]>([])
  const [deletedOrders, setDeletedOrders] = useState<ShowroomOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [monthFilter, setMonthFilter] = useState('')
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
        .select('id, order_number, order_month, order_date, expected_delivery_date, order_status, delivery_status, factory_status, order_source, internal_notes, created_at, deleted_at, order_items(id, order_id, model_name, category, color, quantity, image_url, product_cost, logistics_cost, unit_price, sofa_configuration, customization_note, product_id, created_at), payments(amount)')
        .eq('order_source', 'showroom')
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(500),
      supabase
        .from('orders')
        .select('id, order_number, order_month, order_date, expected_delivery_date, order_status, delivery_status, factory_status, order_source, internal_notes, created_at, deleted_at, order_items(id, order_id, model_name, category, color, quantity, image_url, product_cost, logistics_cost, unit_price, sofa_configuration, customization_note, product_id, created_at), payments(amount)')
        .eq('order_source', 'showroom')
        .not('deleted_at', 'is', null)
        .order('deleted_at', { ascending: false })
        .limit(500),
    ])
    setOrders((activeRes.data as ShowroomOrder[]) ?? [])
    setDeletedOrders((deletedRes.data as ShowroomOrder[]) ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchOrders() }, [fetchOrders])

  useEffect(() => {
    setVisibleCount(50)
    setSelected(new Set())
  }, [deferredSearch, statusFilter, monthFilter, activeTab])

  const sourceList = activeTab === 'deleted' ? deletedOrders : orders

  const availableMonths = useMemo(() => {
    const all = [...orders, ...deletedOrders]
    return [...new Set(all.map(o => o.order_month).filter(Boolean))].sort().reverse()
  }, [orders, deletedOrders])

  function formatMonthLabel(orderMonth: string): string {
    const [mm, yyyy] = orderMonth.split('-')
    return new Date(`${yyyy}-${mm}-01`).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  }

  const filtered = useMemo(() => sourceList.filter(o => {
    const matchSearch = !deferredSearch || o.order_number.toLowerCase().includes(deferredSearch.toLowerCase())
    const matchStatus = !statusFilter || o.delivery_status === statusFilter
    const matchMonth = !monthFilter || o.order_month === monthFilter
    return matchSearch && matchStatus && matchMonth
  }), [sourceList, deferredSearch, statusFilter, monthFilter])

  const visibleOrders = filtered.slice(0, visibleCount)
  const allVisibleSelected = visibleOrders.length > 0 && visibleOrders.every(o => selected.has(o.id))

  function toggleSelectAll() {
    if (allVisibleSelected) {
      setSelected(prev => { const n = new Set(prev); visibleOrders.forEach(o => n.delete(o.id)); return n })
    } else {
      setSelected(prev => { const n = new Set(prev); visibleOrders.forEach(o => n.add(o.id)); return n })
    }
  }
  function toggleSelect(id: string) {
    setSelected(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n })
  }

  async function handleDeliveryStatusChange(orderId: string, status: DeliveryStatus) {
    const order = orders.find(o => o.id === orderId)
    if (!order || order.delivery_status === status) return
    setUpdatingDeliveryId(orderId)
    const result = await updateDeliveryStatus(orderId, status)
    setUpdatingDeliveryId(null)
    if (result.error) { toast.error(result.error); return }
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
          <h1 className="text-2xl font-bold text-stone-900">Show-Room Orders</h1>
          <p className="text-stone-500 text-sm mt-1">{orders.length} active · {deletedOrders.length} deleted</p>
        </div>
        <div className="flex gap-2">
          {activeTab === 'active' && (
            <Button variant="outline" onClick={() => exportCSV(filtered)} title="Export to CSV">
              <Download className="w-4 h-4 mr-2" /> Export CSV
            </Button>
          )}
          <Link href="/admin420/show-room-orders/new">
            <Button className="bg-stone-900 hover:bg-stone-800">
              <Plus className="w-4 h-4 mr-2" /> New Showroom Order
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
          <Input placeholder="Search by order #…" className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="h-10 px-3 border border-stone-200 rounded-lg text-sm text-stone-700 bg-white focus:outline-none focus:ring-2 focus:ring-stone-300" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          {DELIVERY_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <select className="h-10 px-3 border border-stone-200 rounded-lg text-sm text-stone-700 bg-white focus:outline-none focus:ring-2 focus:ring-stone-300" value={monthFilter} onChange={e => setMonthFilter(e.target.value)}>
          <option value="">All Months</option>
          {availableMonths.map(m => <option key={m} value={m}>{formatMonthLabel(m)}</option>)}
        </select>
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && activeTab === 'active' && (
        <div className="flex items-center gap-3 bg-stone-900 text-white rounded-xl px-4 py-3">
          <span className="text-sm font-medium">{selected.size} order{selected.size > 1 ? 's' : ''} selected</span>
          <div className="flex-1" />
          <Button size="sm" variant="outline" onClick={() => setSelected(new Set())} className="border-stone-600 text-stone-300 hover:text-white hover:bg-stone-800">Clear</Button>
          <Button size="sm" onClick={() => setDeleteModal(true)} className="bg-red-600 hover:bg-red-700 text-white border-0">
            <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Delete Selected
          </Button>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-stone-100 overflow-hidden">
        {loading ? (
          <div className="divide-y divide-stone-50">
            {Array.from({ length: 6 }).map((_, i) => (
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
            <Store className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">{activeTab === 'deleted' ? 'No deleted orders' : 'No showroom orders found'}</p>
            {activeTab === 'active' && orders.length === 0 && (
              <p className="text-sm mt-1">
                <Link href="/admin420/show-room-orders/new" className="text-stone-600 underline">Create your first showroom order</Link>
              </p>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-100 bg-stone-50">
                  {activeTab === 'active' && (
                    <th className="px-4 py-3 w-8">
                      <input type="checkbox" checked={allVisibleSelected} onChange={toggleSelectAll} className="rounded border-stone-300 accent-stone-800" />
                    </th>
                  )}
                  <th className="text-left px-4 py-3 font-medium text-stone-500">Order #</th>
                  <th className="text-left px-4 py-3 font-medium text-stone-500">Date</th>
                  <th className="text-left px-4 py-3 font-medium text-stone-500">Items</th>
                  <th className="text-left px-4 py-3 font-medium text-stone-500">Cost</th>
                  <th className="text-left px-4 py-3 font-medium text-stone-500">Paid</th>
                  <th className="text-left px-4 py-3 font-medium text-stone-500">Remaining</th>
                  <th className="text-left px-4 py-3 font-medium text-stone-500">Delivery</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50">
                {visibleOrders.map(order => {
                  const { grandTotal, paidSum, remaining } = computeCosts(order)
                  const itemSummary = (order.order_items ?? []).slice(0, 2).map(i => `${i.model_name} ×${i.quantity}`).join(', ')
                  const extra = (order.order_items ?? []).length > 2 ? ` +${(order.order_items ?? []).length - 2} more` : ''
                  return (
                    <tr
                      key={order.id}
                      className={`hover:bg-stone-50 transition-colors ${activeTab === 'deleted' ? 'opacity-70' : ''} ${selected.has(order.id) ? 'bg-stone-50' : ''}`}
                    >
                      {activeTab === 'active' && (
                        <td className="px-4 py-3">
                          <input type="checkbox" checked={selected.has(order.id)} onChange={() => toggleSelect(order.id)} className="rounded border-stone-300 accent-stone-800" />
                        </td>
                      )}
                      <td className="px-4 py-3 font-mono font-semibold text-stone-800">{order.order_number}</td>
                      <td className="px-4 py-3 text-stone-600">{formatDate(order.order_date)}</td>
                      <td className="px-4 py-3 text-stone-700 max-w-48">
                        <span className="truncate block">{itemSummary}{extra}</span>
                      </td>
                      <td className="px-4 py-3 font-medium text-stone-800">{formatCurrency(grandTotal)}</td>
                      <td className="px-4 py-3 text-green-700 font-medium">{formatCurrency(paidSum)}</td>
                      <td className="px-4 py-3">
                        <span className={`font-semibold ${remaining === 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(remaining)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {activeTab === 'deleted' ? (
                          <DeliveryStatusBadge status={order.delivery_status ?? 'not_scheduled'} />
                        ) : (
                          <select
                            className={deliveryStatusSelectClass(order.delivery_status)}
                            value={order.delivery_status ?? 'not_scheduled'}
                            onChange={e => handleDeliveryStatusChange(order.id, e.target.value as DeliveryStatus)}
                            disabled={updatingDeliveryId === order.id}
                          >
                            {DELIVERY_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                          </select>
                        )}
                      </td>
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
                            <Link href={`/admin420/show-room-orders/${order.id}`} className="text-stone-500 hover:text-stone-900 text-xs font-medium">View →</Link>
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
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {!loading && visibleOrders.length < filtered.length && (
        <div className="flex justify-center">
          <Button variant="outline" onClick={() => setVisibleCount(c => c + 50)}>Load more orders</Button>
        </div>
      )}

      {/* Single delete confirm */}
      <Dialog open={!!singleDeleteId} onOpenChange={open => { if (!open) setSingleDeleteId(null) }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete showroom order?</DialogTitle></DialogHeader>
          <p className="text-sm text-stone-600">This order will be moved to the deleted tab. You can restore it later.</p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setSingleDeleteId(null)}>Cancel</Button>
            <Button onClick={handleSingleDelete} disabled={isDeleting} className="bg-red-600 hover:bg-red-700 text-white">
              {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Delete'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk delete confirm */}
      <Dialog open={deleteModal} onOpenChange={setDeleteModal}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete {selected.size} order{selected.size > 1 ? 's' : ''}?</DialogTitle></DialogHeader>
          <p className="text-sm text-stone-600">These orders will be moved to the deleted tab.</p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setDeleteModal(false)}>Cancel</Button>
            <Button onClick={handleBulkDelete} disabled={isDeleting} className="bg-red-600 hover:bg-red-700 text-white">
              {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : `Delete ${selected.size}`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
