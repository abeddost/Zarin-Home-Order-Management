'use server'

import { createElement } from 'react'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { PRODUCT_IMAGE_MAP } from '@/lib/productImages'
import type { Order, OrderItem, Payment } from '@/types'

function pdfSafeImageUrl(item: OrderItem): string | null {
  const url = item.image_url
  if (!url) return null
  if (!url.toLowerCase().endsWith('.webp')) return url
  const mapped = PRODUCT_IMAGE_MAP[item.model_name]
  return mapped && !mapped.toLowerCase().endsWith('.webp') ? mapped : null
}

export async function generateCustomerPDF(orderId: string): Promise<{ base64?: string; filename?: string; error?: string }> {
  const supabase = await getSupabaseServerClient()

  const [orderResult, paymentsResult] = await Promise.all([
    supabase
      .from('orders')
      .select('id, order_number, order_month, monthly_sequence, customer_id, order_date, total_price, down_payment, remaining_balance, payment_status, payment_method, payment_notes, order_status, factory_status, delivery_status, expected_delivery_date, delivery_address, internal_notes, factory_notes, pdf_url, order_source, created_by, created_at, updated_at, customer:customers(id, name, phone, email, address, city, postal_code, notes, created_at), order_items(id, order_id, product_id, model_name, category, sofa_configuration, color, quantity, image_url, unit_price, customization_note, created_at)')
      .eq('id', orderId)
      .single(),
    supabase
      .from('payments')
      .select('amount, payment_date, payment_method, notes')
      .eq('order_id', orderId)
      .order('payment_date', { ascending: true }),
  ])

  if (orderResult.error || !orderResult.data) return { error: orderResult.error?.message ?? 'Order not found' }
  const order = orderResult.data as unknown as Order
  const payments = (paymentsResult.data ?? []) as Payment[]

  const paidSum = payments.reduce((s, p) => s + p.amount, 0)
  const trueRemaining = Math.max(0, order.remaining_balance - paidSum)

  const { renderToBuffer } = await import('@react-pdf/renderer')
  const { OrderPDF } = await import('@/components/pdf/OrderPDF')

  const orderForPDF = {
    ...order,
    order_items: (order.order_items ?? []).map(item => ({
      ...item,
      image_url: pdfSafeImageUrl(item),
    })),
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buffer = await renderToBuffer(createElement(OrderPDF, { order: orderForPDF, trueRemaining, payments }) as any)

  const safeName = order.customer?.name?.replace(/[^a-zA-Z0-9À-ž]/g, '-').replace(/-+/g, '-') ?? 'Kunde'
  const filename = `Order-${order.order_number}-${safeName}.pdf`

  return { base64: buffer.toString('base64'), filename }
}
