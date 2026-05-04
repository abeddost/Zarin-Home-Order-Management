import { getSupabaseServerClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { OrderEditForm } from '@/components/orders/OrderEditForm'
import type { Order, Customer, Product } from '@/types'

interface Props { params: Promise<{ id: string }> }

export default async function AdminEditOrderPage({ params }: Props) {
  const { id } = await params
  const supabase = await getSupabaseServerClient()

  const [orderResult, customersResult, productsResult] = await Promise.all([
    supabase.from('orders').select('id, order_number, order_month, monthly_sequence, customer_id, order_date, total_price, down_payment, remaining_balance, payment_status, payment_method, payment_notes, order_status, factory_status, delivery_status, expected_delivery_date, delivery_address, internal_notes, factory_notes, pdf_url, order_source, created_by, created_at, updated_at, customer:customers(id, name, phone, email, address, city, postal_code, notes, created_at), order_items(id, order_id, product_id, model_name, category, sofa_configuration, color, quantity, image_url, unit_price, customization_note, created_at)').eq('id', id).single(),
    supabase.from('customers').select('id, name, phone, email, address, city, postal_code, notes, created_at').order('name').limit(500),
    supabase.from('products').select('id, model_name, category, default_image_url, colors, notes, is_active, created_at').eq('is_active', true).order('category').order('model_name').limit(300),
  ])

  if (orderResult.error || !orderResult.data) notFound()

  const order = orderResult.data as unknown as Order
  const customers = (customersResult.data ?? []) as Customer[]
  const products = (productsResult.data ?? []) as Product[]

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <Link href={`/admin420/orders/${id}`} className="inline-flex items-center gap-1 text-sm text-stone-500 hover:text-stone-800 mb-4">
          <ChevronLeft className="w-4 h-4" /> Back to Order #{order.order_number}
        </Link>
        <h1 className="text-2xl font-bold text-stone-900">Edit Order #{order.order_number}</h1>
        <p className="text-stone-500 text-sm mt-1">Update the order details. Items will be replaced when you save.</p>
      </div>
      <OrderEditForm order={order} customers={customers} products={products} basePath="/admin420/orders" />
    </div>
  )
}
