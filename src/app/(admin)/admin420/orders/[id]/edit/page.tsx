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
    supabase.from('orders').select('*, customer:customers(*), order_items(*)').eq('id', id).single(),
    supabase.from('customers').select('*').order('name'),
    supabase.from('products').select('*').eq('is_active', true).order('category').order('model_name'),
  ])

  if (orderResult.error || !orderResult.data) notFound()

  const order = orderResult.data as Order
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
