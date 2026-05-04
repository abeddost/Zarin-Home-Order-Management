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
      .select('*, customer:customers(*), order_items(*)')
      .eq('id', orderId)
      .single(),
    supabase
      .from('payments')
      .select('amount')
      .eq('order_id', orderId),
  ])

  if (orderResult.error || !orderResult.data) return { error: orderResult.error?.message ?? 'Order not found' }
  const order = orderResult.data as Order

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
