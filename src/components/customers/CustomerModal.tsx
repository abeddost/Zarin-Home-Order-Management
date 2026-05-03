'use client'

import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import type { Customer } from '@/types'

interface Props {
  open: boolean
  onClose: () => void
  customer: Customer | null
  onSaved: () => void
}

export function CustomerModal({ open, onClose, customer, onSaved }: Props) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [postalCode, setPostalCode] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (customer) {
      setName(customer.name); setPhone(customer.phone ?? ''); setEmail(customer.email ?? '')
      setAddress(customer.address ?? ''); setCity(customer.city ?? '')
      setPostalCode(customer.postal_code ?? ''); setNotes(customer.notes ?? '')
    } else {
      setName(''); setPhone(''); setEmail(''); setAddress(''); setCity(''); setPostalCode(''); setNotes('')
    }
  }, [customer, open])

  async function handleSave() {
    if (!name.trim()) { toast.error('Customer name is required'); return }
    setSaving(true)
    const supabase = getSupabaseBrowserClient()
    const payload = {
      name: name.trim(),
      phone: phone.trim() || null,
      email: email.trim() || null,
      address: address.trim() || null,
      city: city.trim() || null,
      postal_code: postalCode.trim() || null,
      notes: notes.trim() || null,
    }
    const { error } = customer
      ? await supabase.from('customers').update(payload).eq('id', customer.id)
      : await supabase.from('customers').insert(payload)

    setSaving(false)
    if (error) { toast.error(error.message); return }
    toast.success(customer ? 'Customer updated' : 'Customer added')
    onSaved(); onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{customer ? 'Edit Customer' : 'Add Customer'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label>Full Name *</Label>
            <Input placeholder="Max Mustermann" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input placeholder="+49 160 000 0000" value={phone} onChange={e => setPhone(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input type="email" placeholder="email@example.com" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Address</Label>
            <Input placeholder="Musterstraße 1" value={address} onChange={e => setAddress(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>City</Label>
              <Input placeholder="Berlin" value={city} onChange={e => setCity(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Postal Code</Label>
              <Input placeholder="10115" value={postalCode} onChange={e => setPostalCode(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea placeholder="Optional notes" value={notes} onChange={e => setNotes(e.target.value)} rows={2} />
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button className="flex-1 bg-stone-900 hover:bg-stone-800" onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {customer ? 'Save Changes' : 'Add Customer'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
