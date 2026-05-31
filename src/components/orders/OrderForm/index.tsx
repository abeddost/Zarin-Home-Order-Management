'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { ChevronLeft, ChevronRight, Loader2, Check } from 'lucide-react'
import { createOrder, createCustomer } from '@/actions/orders'
import { Step1Customer } from './Step1Customer'
import { Step2Items } from './Step2Items'
import { Step3Payment } from './Step3Payment'
import { Step4Tracking } from './Step4Tracking'
import { Step5Preview } from './Step5Preview'
import { getAllOrderFormErrors, getOrderFormStepErrors } from './validation'
import type { Customer, Product, OrderItemFormValues } from '@/types'

export interface FormState {
  // Customer
  customer_id: string
  customer_mode: 'existing' | 'new'
  new_customer_name: string
  new_customer_phone: string
  new_customer_email: string
  new_customer_address: string
  new_customer_city: string
  new_customer_postal_code: string
  // Items
  items: OrderItemFormValues[]
  // Order
  order_date: string
  total_price: number
  down_payment: number
  payment_method: string
  payment_notes: string
  factory_status: string
  delivery_status: string
  expected_delivery_date: string
  delivery_address: string
  internal_notes: string
  factory_notes: string
  order_source: string
}

export const EMPTY_ITEM = (): OrderItemFormValues => ({
  product_id: '', model_name: '', category: '', sofa_configuration: '',
  color: '', quantity: 1, image_url: '', unit_price: 0,
  product_cost: 0, logistics_cost: 0, customization_note: '',
})

const STEPS = ['Customer', 'Items', 'Payment', 'Tracking', 'Review']

interface Props {
  customers: Customer[]
  products: Product[]
  basePath?: string
}

export function OrderForm({ customers, products, basePath = '/orders' }: Props) {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [isPending, startTransition] = useTransition()
  const [stepErrors, setStepErrors] = useState<string[]>([])

  const today = new Date().toISOString().split('T')[0]
  const [form, setForm] = useState<FormState>({
    customer_id: '',
    customer_mode: 'existing',
    new_customer_name: '',
    new_customer_phone: '',
    new_customer_email: '',
    new_customer_address: '',
    new_customer_city: '',
    new_customer_postal_code: '',
    items: [EMPTY_ITEM()],
    order_date: today,
    total_price: 0,
    down_payment: 0,
    payment_method: '',
    payment_notes: '',
    factory_status: 'not_sent',
    delivery_status: 'not_scheduled',
    expected_delivery_date: '',
    delivery_address: '',
    internal_notes: '',
    factory_notes: '',
    order_source: '',
  })

  useEffect(() => {
    const total = form.items.reduce((s, i) => s + i.unit_price * i.quantity, 0)
    setForm(f => ({ ...f, total_price: total }))
  }, [form.items])

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
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
  function removeItem(index: number) { setForm(f => ({ ...f, items: f.items.filter((_, i) => i !== index) })) }

  useEffect(() => {
    if (stepErrors.length > 0) setStepErrors(getOrderFormStepErrors(form, step))
  }, [form, step, stepErrors.length])

  function validate(): boolean {
    const errors = getOrderFormStepErrors(form, step)
    setStepErrors(errors)
    if (errors.length > 0) {
      toast.error(errors[0])
      return false
    }
    return true
  }

  function next() {
    if (validate()) {
      setStepErrors([])
      setStep(s => Math.min(s + 1, STEPS.length - 1))
    }
  }
  function prev() {
    setStepErrors([])
    setStep(s => Math.max(s - 1, 0))
  }

  async function handleSubmit() {
    const allErrors = getAllOrderFormErrors(form)
    if (allErrors.length > 0) {
      setStep(allErrors[0].step)
      setStepErrors(allErrors[0].errors)
      toast.error(allErrors[0].errors[0])
      return
    }

    startTransition(async () => {
      let customerId = form.customer_id

      if (form.customer_mode === 'new') {
        const res = await createCustomer({
          name: form.new_customer_name,
          phone: form.new_customer_phone,
          email: form.new_customer_email,
          address: form.new_customer_address,
          city: form.new_customer_city,
          postal_code: form.new_customer_postal_code,
        })
        if (res.error) { toast.error(res.error); return }
        customerId = res.customerId!
      }

      const result = await createOrder({
        customer_id: customerId,
        order_date: form.order_date,
        items: form.items.filter(i => i.model_name.trim()),
        total_price: form.total_price,
        down_payment: form.down_payment,
        payment_method: form.payment_method,
        payment_notes: form.payment_notes,
        factory_status: form.factory_status,
        delivery_status: form.delivery_status,
        expected_delivery_date: form.expected_delivery_date,
        delivery_address: form.delivery_address,
        internal_notes: form.internal_notes,
        factory_notes: form.factory_notes,
        order_source: form.order_source,
      })

      if (result.error) { toast.error(result.error); return }
      toast.success(`Order #${result.orderNumber} created successfully`)
      router.push(`${basePath}/${result.orderId}`)
    })
  }

  const stepComponents = [
    <Step1Customer key="s1" form={form} customers={customers} set={set} />,
    <Step2Items key="s2" form={form} products={products} setItemField={setItemField} addItem={addItem} removeItem={removeItem} />,
    <Step3Payment key="s3" form={form} set={set} />,
    <Step4Tracking key="s4" form={form} set={set} />,
    <Step5Preview key="s5" form={form} customers={customers} products={products} />,
  ]

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-0 mb-8">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center flex-1 last:flex-none">
            <button
              onClick={() => i < step && setStep(i)}
              className={`flex items-center gap-2 shrink-0 ${i < step ? 'cursor-pointer' : 'cursor-default'}`}
            >
              <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                i < step ? 'bg-stone-800 text-white' :
                i === step ? 'bg-stone-900 text-white' :
                'bg-stone-100 text-stone-400'
              }`}>
                {i < step ? <Check className="w-3.5 h-3.5" /> : i + 1}
              </span>
              <span className={`text-sm hidden sm:block ${i === step ? 'font-semibold text-stone-800' : 'text-stone-400'}`}>
                {label}
              </span>
            </button>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-px mx-3 ${i < step ? 'bg-stone-800' : 'bg-stone-200'}`} />
            )}
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-6 mb-6">
        {stepErrors.length > 0 && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <p className="font-semibold mb-1">Please fix these required fields:</p>
            <ul className="list-disc pl-5 space-y-0.5">
              {stepErrors.map(error => <li key={error}>{error}</li>)}
            </ul>
          </div>
        )}
        {stepComponents[step]}
      </div>

      <div className="flex gap-3 justify-between">
        <Button variant="outline" onClick={prev} disabled={step === 0}>
          <ChevronLeft className="w-4 h-4 mr-1" /> Previous
        </Button>
        {step < STEPS.length - 1 ? (
          <Button className="bg-stone-900 hover:bg-stone-800" onClick={next}>
            Next <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        ) : (
          <Button className="bg-stone-900 hover:bg-stone-800 min-w-32" onClick={handleSubmit} disabled={isPending}>
            {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Save Order
          </Button>
        )}
      </div>
    </div>
  )
}
