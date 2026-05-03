'use client'

import { useEffect, useState } from 'react'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CustomerModal } from '@/components/customers/CustomerModal'
import { formatDate } from '@/lib/utils'
import { Plus, Search, Pencil, Users, Phone } from 'lucide-react'
import type { Customer } from '@/types'

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Customer | null>(null)

  async function fetchCustomers() {
    const supabase = getSupabaseBrowserClient()
    const { data } = await supabase.from('customers').select('*').order('name')
    setCustomers((data as Customer[]) ?? [])
    setLoading(false)
  }

  useEffect(() => { fetchCustomers() }, [])

  const filtered = customers.filter(c =>
    !search ||
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.phone ?? '').includes(search) ||
    (c.city ?? '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Customers</h1>
          <p className="text-stone-500 text-sm mt-1">{customers.length} customers</p>
        </div>
        <Button className="bg-stone-900 hover:bg-stone-800" onClick={() => { setEditing(null); setModalOpen(true) }}>
          <Plus className="w-4 h-4 mr-2" /> Add Customer
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
        <Input placeholder="Search by name, phone, city..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-stone-100 overflow-hidden">
        {loading ? (
          <div className="divide-y divide-stone-50">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="px-6 py-4 animate-pulse flex items-center gap-4">
                <div className="w-10 h-10 bg-stone-200 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-stone-200 rounded w-1/4" />
                  <div className="h-3 bg-stone-100 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-stone-400">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No customers found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-100 bg-stone-50">
                  <th className="text-left px-6 py-3 font-medium text-stone-500">Name</th>
                  <th className="text-left px-6 py-3 font-medium text-stone-500">Phone</th>
                  <th className="text-left px-6 py-3 font-medium text-stone-500">City</th>
                  <th className="text-left px-6 py-3 font-medium text-stone-500">Address</th>
                  <th className="text-left px-6 py-3 font-medium text-stone-500">Added</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50">
                {filtered.map(customer => (
                  <tr key={customer.id} className="hover:bg-stone-50 transition-colors">
                    <td className="px-6 py-3 font-medium text-stone-800">{customer.name}</td>
                    <td className="px-6 py-3 text-stone-600">
                      <a href={`tel:${customer.phone}`} className="flex items-center gap-1.5 hover:text-stone-900">
                        <Phone className="w-3 h-3" /> {customer.phone ?? '—'}
                      </a>
                    </td>
                    <td className="px-6 py-3 text-stone-600">{customer.city ?? '—'}</td>
                    <td className="px-6 py-3 text-stone-500 max-w-xs truncate">{customer.address ?? '—'}</td>
                    <td className="px-6 py-3 text-stone-400">{formatDate(customer.created_at)}</td>
                    <td className="px-6 py-3">
                      <Button variant="ghost" size="sm" onClick={() => { setEditing(customer); setModalOpen(true) }}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <CustomerModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        customer={editing}
        onSaved={fetchCustomers}
      />
    </div>
  )
}
