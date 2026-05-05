'use client'

import { formatCurrency, formatDate, isSofaCategory } from '@/lib/utils'
import { ORDER_STATUSES, FACTORY_STATUSES, DELIVERY_STATUSES, PAYMENT_METHODS } from '@/lib/constants'
import { getProductImage, getProductThumbnail, PRODUCT_IMAGE_SIZES } from '@/lib/productImages'
import Image from 'next/image'
import type { Customer, Product } from '@/types'
import type { FormState } from './index'

interface Props {
  form: FormState
  customers: Customer[]
  products: Product[]
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between items-start gap-4 py-1.5 border-b border-stone-50 last:border-0">
      <span className="text-stone-500 text-sm shrink-0">{label}</span>
      <span className="text-stone-800 text-sm font-medium text-right">{value || '—'}</span>
    </div>
  )
}

export function Step5Preview({ form, customers, products }: Props) {
  const customer = customers.find(c => c.id === form.customer_id)
  const remaining = form.total_price - form.down_payment

  const factoryLabel = FACTORY_STATUSES.find(s => s.value === form.factory_status)?.label ?? form.factory_status
  const deliveryLabel = DELIVERY_STATUSES.find(s => s.value === form.delivery_status)?.label ?? form.delivery_status
  const paymentLabel = PAYMENT_METHODS.find(m => m.value === form.payment_method)?.label ?? form.payment_method

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-stone-800">Review Order</h2>
        <p className="text-sm text-stone-500 mt-1">Check all details before saving. Click "Save Order" to create the order.</p>
      </div>

      {/* Customer */}
      <section>
        <h3 className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-2">Customer</h3>
        <div className="bg-stone-50 rounded-xl p-4">
          {customer ? (
            <>
              <p className="font-semibold text-stone-800">{customer.name}</p>
              <p className="text-sm text-stone-500">{[customer.phone, customer.city].filter(Boolean).join(' · ')}</p>
            </>
          ) : (
            <p className="text-stone-400 text-sm">No customer selected</p>
          )}
          <p className="text-sm text-stone-500 mt-1">Order Date: {formatDate(form.order_date)}</p>
        </div>
      </section>

      {/* Items */}
      <section>
        <h3 className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-2">
          Items ({form.items.length})
        </h3>
        <div className="space-y-2">
          {form.items.map((item, i) => {
            const prod = products.find(p => p.id === item.product_id)
            const imgUrl = prod ? getProductImage(prod.model_name, prod.default_image_url ?? undefined) : item.image_url
            const thumbUrl = imgUrl ? getProductThumbnail(item.model_name || prod?.model_name || '', imgUrl, { width: 96, height: 96 }) : ''
            return (
              <div key={i} className="flex items-center gap-3 bg-stone-50 rounded-xl p-3">
                <div className="w-12 h-12 rounded-lg bg-stone-200 overflow-hidden shrink-0">
                  {thumbUrl ? (
                    <Image
                      src={thumbUrl}
                      alt={item.model_name}
                      width={48}
                      height={48}
                      sizes={PRODUCT_IMAGE_SIZES.thumb}
                      className="object-cover w-full h-full"
                      unoptimized
                    />
                  ) : null}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-stone-800 text-sm">{item.model_name}</p>
                  <p className="text-xs text-stone-400">
                    {item.category}
                    {isSofaCategory(item.category) && item.sofa_configuration ? ` · ${item.sofa_configuration}` : ''}
                    {item.color ? ` · ${item.color}` : ''}
                    {' · '}Qty: {item.quantity}
                  </p>
                </div>
                <p className="text-sm font-semibold text-stone-700 shrink-0">{formatCurrency(item.unit_price * item.quantity)}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* Payment */}
      <section>
        <h3 className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-2">Payment</h3>
        <div className="bg-stone-50 rounded-xl p-4">
          <Row label="Total Price" value={formatCurrency(form.total_price)} />
          <Row label="Down Payment" value={formatCurrency(form.down_payment)} />
          <Row label="Remaining Balance" value={<span className={remaining > 0 ? 'text-orange-600' : 'text-green-600'}>{formatCurrency(Math.max(0, remaining))}</span>} />
          <Row label="Payment Method" value={paymentLabel} />
          {form.payment_notes && <Row label="Notes" value={form.payment_notes} />}
        </div>
      </section>

      {/* Tracking */}
      <section>
        <h3 className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-2">Tracking</h3>
        <div className="bg-stone-50 rounded-xl p-4">
          <Row label="Factory Status" value={factoryLabel} />
          <Row label="Delivery Status" value={deliveryLabel} />
          {form.expected_delivery_date && <Row label="Expected Delivery" value={formatDate(form.expected_delivery_date)} />}
          {form.delivery_address && <Row label="Delivery Address" value={form.delivery_address} />}
          {form.factory_notes && <Row label="Factory Notes" value={form.factory_notes} />}
          {form.internal_notes && <Row label="Internal Notes" value={form.internal_notes} />}
        </div>
      </section>

      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-700">
        The order will be saved as <strong>Draft</strong>. You can generate and download the PDF from the order detail page.
      </div>
    </div>
  )
}
