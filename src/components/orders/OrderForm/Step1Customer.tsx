'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Search, User, UserPlus } from 'lucide-react'
import type { Customer } from '@/types'
import type { FormState } from './index'

interface Props {
  form: FormState
  customers: Customer[]
  set: <K extends keyof FormState>(key: K, value: FormState[K]) => void
}

export function Step1Customer({ form, customers, set }: Props) {
  const [search, setSearch] = useState('')

  const filtered = customers.filter(c =>
    !search ||
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.phone ?? '').includes(search) ||
    (c.city ?? '').toLowerCase().includes(search.toLowerCase())
  )

  const selected = customers.find(c => c.id === form.customer_id)

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-stone-800">Customer</h2>
        <p className="text-sm text-stone-500 mt-1">Select an existing customer or enter new customer details.</p>
      </div>

      {/* Order date */}
      <div className="space-y-1.5">
        <Label>Order Date *</Label>
        <Input
          type="date"
          value={form.order_date}
          onChange={e => set('order_date', e.target.value)}
          className="max-w-xs"
        />
      </div>

      {/* Mode toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => set('customer_mode', 'existing')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
            form.customer_mode === 'existing'
              ? 'bg-stone-900 text-white border-stone-900'
              : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'
          }`}
        >
          <User className="w-4 h-4" /> Existing Customer
        </button>
        <button
          onClick={() => set('customer_mode', 'new')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
            form.customer_mode === 'new'
              ? 'bg-stone-900 text-white border-stone-900'
              : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'
          }`}
        >
          <UserPlus className="w-4 h-4" /> New Customer
        </button>
      </div>

      {form.customer_mode === 'existing' ? (
        <>
          {/* Search */}
          <div className="space-y-1.5">
            <Label>Search Customer</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <Input
                placeholder="Name, phone, or city..."
                className="pl-9"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Customer list */}
          <div className="border border-stone-200 rounded-xl overflow-hidden max-h-64 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="py-8 text-center text-stone-400 text-sm">No customers found</div>
            ) : (
              filtered.map(c => (
                <button
                  key={c.id}
                  onClick={() => set('customer_id', c.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors border-b border-stone-50 last:border-0 ${
                    form.customer_id === c.id
                      ? 'bg-stone-900 text-white'
                      : 'hover:bg-stone-50'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    form.customer_id === c.id ? 'bg-white/20' : 'bg-stone-100'
                  }`}>
                    <User className={`w-4 h-4 ${form.customer_id === c.id ? 'text-white' : 'text-stone-500'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium text-sm truncate ${form.customer_id === c.id ? 'text-white' : 'text-stone-800'}`}>
                      {c.name}
                    </p>
                    <p className={`text-xs truncate ${form.customer_id === c.id ? 'text-white/70' : 'text-stone-400'}`}>
                      {[c.phone, c.city].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>

          {selected && (
            <div className="bg-stone-50 rounded-xl p-4 text-sm">
              <p className="font-semibold text-stone-800 mb-2">Selected: {selected.name}</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-stone-600">
                {selected.phone && <span>📞 {selected.phone}</span>}
                {selected.email && <span>✉️ {selected.email}</span>}
                {selected.address && <span className="col-span-2">📍 {selected.address}, {selected.city}</span>}
              </div>
            </div>
          )}
        </>
      ) : (
        /* New customer fields */
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Full Name *</Label>
            <Input
              placeholder="Max Mustermann"
              value={form.new_customer_name}
              onChange={e => set('new_customer_name', e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Phone *</Label>
              <Input
                placeholder="+49 160 000 0000"
                value={form.new_customer_phone}
                onChange={e => set('new_customer_phone', e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input
                type="email"
                placeholder="email@example.com"
                value={form.new_customer_email}
                onChange={e => set('new_customer_email', e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Address</Label>
            <Input
              placeholder="Musterstraße 1"
              value={form.new_customer_address}
              onChange={e => set('new_customer_address', e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>City</Label>
              <Input
                placeholder="Berlin"
                value={form.new_customer_city}
                onChange={e => set('new_customer_city', e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Postal Code</Label>
              <Input
                placeholder="10115"
                value={form.new_customer_postal_code}
                onChange={e => set('new_customer_postal_code', e.target.value)}
              />
            </div>
          </div>
          <p className="text-xs text-stone-400">This customer will be saved to the customer list when the order is created.</p>
        </div>
      )}
    </div>
  )
}
