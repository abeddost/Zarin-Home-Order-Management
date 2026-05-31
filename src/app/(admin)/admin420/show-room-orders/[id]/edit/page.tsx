import { getSupabaseServerClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { ShowroomOrderForm } from '@/components/showroom/ShowroomOrderForm'
import type { Order, Product } from '@/types'
import type { ShowroomFormState } from '@/components/showroom/ShowroomOrderForm'

interface Props { params: Promise<{ id: string }> }

function orderToFormState(order: Order): ShowroomFormState {
  return {
    items: (order.order_items ?? []).map(item => ({
      product_id: item.product_id ?? '',
      model_name: item.model_name,
      category: item.category,
      sofa_configuration: item.sofa_configuration ?? '',
      color: item.color ?? '',
      quantity: item.quantity,
      image_url: item.image_url ?? '',
      unit_price: item.unit_price,
      product_cost: item.product_cost ?? 0,
      logistics_cost: item.logistics_cost ?? 0,
      customization_note: item.customization_note ?? '',
    })),
    order_date: order.order_date,
    factory_status: order.factory_status ?? 'not_sent',
    delivery_status: order.delivery_status ?? 'not_scheduled',
    expected_delivery_date: order.expected_delivery_date ?? '',
    internal_notes: order.internal_notes ?? '',
    factory_notes: order.factory_notes ?? '',
  }
}

export default async function EditShowroomOrderPage({ params }: Props) {
  const { id } = await params
  const supabase = await getSupabaseServerClient()

  const [orderResult, productsResult] = await Promise.all([
    supabase
      .from('orders')
      .select('id, order_number, order_month, monthly_sequence, customer_id, order_date, total_price, down_payment, remaining_balance, payment_status, payment_method, payment_notes, order_status, factory_status, delivery_status, expected_delivery_date, delivery_address, internal_notes, factory_notes, pdf_url, order_source, created_by, created_at, updated_at, order_items(id, order_id, product_id, model_name, category, sofa_configuration, color, quantity, image_url, unit_price, product_cost, logistics_cost, customization_note, created_at)')
      .eq('id', id)
      .eq('order_source', 'showroom')
      .single(),
    supabase
      .from('products')
      .select('id, model_name, category, default_image_url, colors, notes, is_active, created_at')
      .eq('is_active', true)
      .order('category')
      .order('model_name')
      .limit(300),
  ])

  if (orderResult.error || !orderResult.data) notFound()

  const order = orderResult.data as unknown as Order
  const products = (productsResult.data ?? []) as Product[]

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <Link href={`/admin420/show-room-orders/${id}`} className="inline-flex items-center gap-1 text-sm text-stone-500 hover:text-stone-800 mb-4">
          <ChevronLeft className="w-4 h-4" /> Back to Order #{order.order_number}
        </Link>
        <h1 className="text-2xl font-bold text-stone-900">Edit Showroom Order #{order.order_number}</h1>
        <p className="text-stone-500 text-sm mt-1">Items will be replaced when you save.</p>
      </div>
      <ShowroomOrderForm
        products={products}
        basePath="/admin420/show-room-orders"
        initialValues={orderToFormState(order)}
        orderId={order.id}
      />
    </div>
  )
}
