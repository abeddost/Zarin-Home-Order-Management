'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { ChevronLeft, ChevronRight, Loader2, Check } from 'lucide-react'
import { createShowroomOrder, updateOrder } from '@/actions/orders'
import { Step1Items } from './Step1Items'
import { Step2Tracking } from './Step2Tracking'
import { Step3Preview } from './Step3Preview'
import type { Product, OrderItemFormValues } from '@/types'

export interface ShowroomFormState {
  items: OrderItemFormValues[]
  order_date: string
  factory_status: string
  delivery_status: string
  expected_delivery_date: string
  internal_notes: string
  factory_notes: string
}

const EMPTY_ITEM = (): OrderItemFormValues => ({
  product_id: '', model_name: '', category: '', sofa_configuration: '',
  color: '', quantity: 1, image_url: '', unit_price: 0,
  product_cost: 0, logistics_cost: 0, customization_note: '',
})

const STEPS = ['Items', 'Tracking', 'Review']

interface Props {
  products: Product[]
  basePath?: string
  initialValues?: ShowroomFormState
  orderId?: string
}

export function ShowroomOrderForm({ products, basePath = '/admin420/show-room-orders', initialValues, orderId }: Props) {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [isPending, startTransition] = useTransition()

  const today = new Date().toISOString().split('T')[0]
  const [form, setForm] = useState<ShowroomFormState>(initialValues ?? {
    items: [EMPTY_ITEM()],
    order_date: today,
    factory_status: 'not_sent',
    delivery_status: 'not_scheduled',
    expected_delivery_date: '',
    internal_notes: '',
    factory_notes: '',
  })

  function set<K extends keyof ShowroomFormState>(key: K, value: ShowroomFormState[K]) {
    setForm(f => ({ ...f, [key]: value }))
  }

  function setItemField(index: number, field: keyof OrderItemFormValues, value: string | number) {
    setForm(f => {
      const items = [...f.items]
      items[index] = { ...items[index], [field]: value }
      return { ...f, items }
    })
  }

  function addItem() { setForm(f => ({ ...f, items: [...f.items, EMPTY_ITEM()] })) }
  function removeItem(index: number) {
    setForm(f => ({ ...f, items: f.items.filter((_, i) => i !== index) }))
  }

  function validate(): boolean {
    if (step === 0) {
      if (form.items.length === 0) { toast.error('Add at least one item'); return false }
      const missing = form.items.findIndex(i => !i.model_name.trim())
      if (missing >= 0) { toast.error(`Item ${missing + 1} needs a model name`); return false }
    }
    if (step === 1) {
      if (!form.order_date) { toast.error('Order date is required'); return false }
    }
    return true
  }

  function next() {
    if (validate()) setStep(s => Math.min(s + 1, STEPS.length - 1))
  }
  function prev() { setStep(s => Math.max(s - 1, 0)) }

  async function handleSubmit() {
    if (!form.order_date) { toast.error('Order date is required'); return }
    if (form.items.length === 0) { toast.error('Add at least one item'); return }

    startTransition(async () => {
      const grandTotal = form.items.reduce((s, i) => s + (i.product_cost + i.logistics_cost) * i.quantity, 0)

      if (orderId) {
        const result = await updateOrder(orderId, {
          customer_id: '',
          order_date: form.order_date,
          items: form.items,
          total_price: grandTotal,
          down_payment: 0,
          payment_method: '',
          payment_notes: '',
          factory_status: form.factory_status,
          delivery_status: form.delivery_status,
          expected_delivery_date: form.expected_delivery_date,
          delivery_address: '',
          internal_notes: form.internal_notes,
          factory_notes: form.factory_notes,
          order_source: 'showroom',
        })
        if (result.error) { toast.error(result.error); return }
        toast.success('Showroom order updated')
        router.push(`${basePath}/${orderId}`)
      } else {
        const result = await createShowroomOrder({
          order_date: form.order_date,
          items: form.items,
          total_price: grandTotal,
          factory_status: form.factory_status,
          delivery_status: form.delivery_status,
          expected_delivery_date: form.expected_delivery_date,
          internal_notes: form.internal_notes,
          factory_notes: form.factory_notes,
        })
        if (result.error) { toast.error(result.error); return }
        toast.success(`Showroom order #${result.orderNumber} created`)
        router.push(`${basePath}/${result.orderId}`)
      }
    })
  }

  const isLast = step === STEPS.length - 1

  return (
    <div className="space-y-6">
      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {STEPS.map((label, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
              i < step ? 'bg-stone-900 text-white' : i === step ? 'bg-stone-800 text-white ring-2 ring-stone-300' : 'bg-stone-100 text-stone-400'
            }`}>
              {i < step ? <Check className="w-3.5 h-3.5" /> : i + 1}
            </div>
            <span className={`text-sm font-medium hidden sm:inline ${i === step ? 'text-stone-900' : 'text-stone-400'}`}>{label}</span>
            {i < STEPS.length - 1 && <div className="w-8 h-px bg-stone-200 mx-1" />}
          </div>
        ))}
      </div>

      {/* Step content */}
      <div className="bg-white rounded-xl border border-stone-100 p-6 shadow-sm">
        {step === 0 && (
          <Step1Items form={form} products={products} setItemField={setItemField} addItem={addItem} removeItem={removeItem} />
        )}
        {step === 1 && <Step2Tracking form={form} set={set} />}
        {step === 2 && <Step3Preview form={form} />}
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={prev} disabled={step === 0}>
          <ChevronLeft className="w-4 h-4 mr-1" /> Back
        </Button>
        {isLast ? (
          <Button onClick={handleSubmit} disabled={isPending} className="bg-stone-900 hover:bg-stone-800">
            {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
            {orderId ? 'Save Changes' : 'Create Showroom Order'}
          </Button>
        ) : (
          <Button onClick={next} className="bg-stone-900 hover:bg-stone-800">
            Next <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        )}
      </div>
    </div>
  )
}
