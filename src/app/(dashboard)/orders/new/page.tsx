import { getSupabaseServerClient } from '@/lib/supabase/server'
import { OrderForm } from '@/components/orders/OrderForm'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import type { Customer, Product } from '@/types'

export default async function NewOrderPage() {
  const supabase = await getSupabaseServerClient()

  const [customersResult, productsResult] = await Promise.all([
    supabase.from('customers').select('id, name, phone, email, address, city, postal_code, notes, created_at').order('name').limit(500),
    supabase.from('products').select('id, model_name, category, default_image_url, colors, notes, is_active, created_at').eq('is_active', true).order('category').order('model_name').limit(300),
  ])

  const customers = (customersResult.data ?? []) as Customer[]
  const products = (productsResult.data ?? []) as Product[]

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <Link href="/orders" className="inline-flex items-center gap-1 text-sm text-stone-500 hover:text-stone-800 mb-4">
          <ChevronLeft className="w-4 h-4" /> Back to Orders
        </Link>
        <h1 className="text-2xl font-bold text-stone-900">New Order</h1>
        <p className="text-stone-500 text-sm mt-1">Fill in the steps below to create a new furniture order.</p>
      </div>
      <OrderForm customers={customers} products={products} />
    </div>
  )
}
