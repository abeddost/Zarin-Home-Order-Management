'use server'

import { createElement } from 'react'
import { getSupabaseServerClient, getSupabaseServiceClient } from '@/lib/supabase/server'
import { PRODUCT_IMAGE_MAP } from '@/lib/productImages'
import type { Order, OrderItem } from '@/types'

function pdfSafeImageUrl(item: OrderItem): string | null {
  const url = item.image_url
  if (!url) return null
  if (!url.toLowerCase().endsWith('.webp')) return url
  const mapped = PRODUCT_IMAGE_MAP[item.model_name]
  return mapped && !mapped.toLowerCase().endsWith('.webp') ? mapped : null
}

export async function generateAndUploadFactoryPDF(orderId: string): Promise<{ url?: string; error?: string }> {
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

  const serviceClient = await getSupabaseServiceClient()
  const safeName = order.customer?.name?.replace(/[^a-zA-Z0-9À-ž]/g, '-').replace(/-+/g, '-') ?? 'Kunde'
  const fileName = `Factory-Order-${order.order_number}-${safeName}-${Date.now()}.pdf`

  const { error: uploadError } = await serviceClient.storage
    .from('generated-pdfs')
    .upload(fileName, buffer, { contentType: 'application/pdf' })

  if (uploadError) return { error: uploadError.message }

  const { data: urlData, error: urlError } = await serviceClient.storage
    .from('generated-pdfs')
    .createSignedUrl(fileName, 60 * 60 * 24 * 30)

  if (urlError || !urlData) return { error: urlError?.message ?? 'Failed to create URL' }

  return { url: urlData.signedUrl }
}
