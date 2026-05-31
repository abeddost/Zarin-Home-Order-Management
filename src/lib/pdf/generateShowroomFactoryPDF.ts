'use server'

import { createElement } from 'react'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { PRODUCT_IMAGE_MAP } from '@/lib/productImages'
import type { Order, OrderItem } from '@/types'

function pdfSafeImageUrl(item: OrderItem): string | null {
  const url = item.image_url
  if (!url) return null
  if (!url.toLowerCase().endsWith('.webp')) return url
  const mapped = PRODUCT_IMAGE_MAP[item.model_name]
  return mapped && !mapped.toLowerCase().endsWith('.webp') ? mapped : null
}

export async function generateShowroomFactoryPDF(orderId: string): Promise<{ base64?: string; filename?: string; error?: string }> {
  const supabase = await getSupabaseServerClient()

  const { data, error } = await supabase
    .from('orders')
    .select('id, order_number, order_month, monthly_sequence, customer_id, order_date, total_price, down_payment, remaining_balance, payment_status, payment_method, payment_notes, order_status, factory_status, delivery_status, expected_delivery_date, delivery_address, internal_notes, factory_notes, pdf_url, order_source, created_by, created_at, updated_at, deleted_at, order_items(id, order_id, product_id, model_name, category, sofa_configuration, color, quantity, image_url, unit_price, product_cost, logistics_cost, customization_note, created_at)')
    .eq('id', orderId)
    .single()

  if (error || !data) return { error: error?.message ?? 'Order not found' }

  const order = data as unknown as Order

  const { renderToBuffer } = await import('@react-pdf/renderer')
  const { ShowroomFactoryPDF } = await import('@/components/pdf/ShowroomFactoryPDF')

  const orderForPDF = {
    ...order,
    order_items: (order.order_items ?? []).map(item => ({
      ...item,
      image_url: pdfSafeImageUrl(item),
    })),
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buffer = await renderToBuffer(createElement(ShowroomFactoryPDF, { order: orderForPDF }) as any)
  const filename = `Showroom-Factory-${order.order_number}.pdf`

  return { base64: buffer.toString('base64'), filename }
}
