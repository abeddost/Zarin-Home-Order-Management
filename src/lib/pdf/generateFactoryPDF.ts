'use server'

import { createElement } from 'react'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { PRODUCT_IMAGE_MAP } from '@/lib/productImages'
import { getUserAccess } from '@/lib/access'
import type { Order, OrderItem } from '@/types'

function pdfSafeImageUrl(item: OrderItem): string | null {
  const url = item.image_url
  if (!url) return null
  if (!url.toLowerCase().endsWith('.webp')) return url
  const mapped = PRODUCT_IMAGE_MAP[item.model_name]
  return mapped && !mapped.toLowerCase().endsWith('.webp') ? mapped : null
}

async function buildBuffer(orderId: string): Promise<{
  buffer?: Buffer
  order?: Order
  trueRemaining?: number
  error?: string
}> {
  const supabase = await getSupabaseServerClient()

  const [orderResult, paymentsResult] = await Promise.all([
    supabase
      .from('orders')
      .select('id, order_number, order_month, monthly_sequence, customer_id, order_date, total_price, down_payment, remaining_balance, payment_status, payment_method, payment_notes, order_status, factory_status, delivery_status, expected_delivery_date, delivery_address, internal_notes, factory_notes, pdf_url, order_source, created_by, created_at, updated_at, customer:customers(id, name, phone, email, address, city, postal_code, notes, created_at), order_items(id, order_id, product_id, model_name, category, sofa_configuration, color, quantity, image_url, unit_price, customization_note, created_at)')
      .eq('id', orderId)
      .single(),
    supabase
      .from('payments')
      .select('amount')
      .eq('order_id', orderId),
  ])

  if (orderResult.error || !orderResult.data) return { error: orderResult.error?.message ?? 'Order not found' }
  const order = orderResult.data as unknown as Order
  const { data: { user } } = await supabase.auth.getUser()

  if (getUserAccess(user) === 'factory-products' && order.order_source !== 'turkey') {
    return { error: 'Not allowed to generate this factory PDF' }
  }

  const paidSum = (paymentsResult.data ?? []).reduce((s, p) => s + p.amount, 0)
  const trueRemaining = Math.max(0, order.remaining_balance - paidSum)

  const { renderToBuffer } = await import('@react-pdf/renderer')
  const { FactoryPDF } = await import('@/components/pdf/FactoryPDF')

  const orderForPDF = {
    ...order,
    order_items: (order.order_items ?? []).map(item => ({
      ...item,
      image_url: pdfSafeImageUrl(item),
    })),
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buffer = await renderToBuffer(createElement(FactoryPDF, { order: orderForPDF, trueRemaining }) as any)
  return { buffer: buffer as unknown as Buffer, order, trueRemaining }
}

/** On-demand generation — returns base64, no storage. */
export async function generateFactoryPDF(orderId: string): Promise<{ base64?: string; filename?: string; error?: string }> {
  const { buffer, order, error } = await buildBuffer(orderId)
  if (error || !buffer || !order) return { error: error ?? 'Failed to generate PDF' }

  const safeName = order.customer?.name?.replace(/[^a-zA-Z0-9À-ž]/g, '-').replace(/-+/g, '-') ?? 'Fabrika'
  const filename = `Factory-Order-${order.order_number}-${safeName}.pdf`

  return { base64: Buffer.from(buffer).toString('base64'), filename }
}
