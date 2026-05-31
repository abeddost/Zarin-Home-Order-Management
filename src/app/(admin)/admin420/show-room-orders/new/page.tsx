import { getSupabaseServerClient } from '@/lib/supabase/server'
import { ShowroomOrderForm } from '@/components/showroom/ShowroomOrderForm'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import type { Product } from '@/types'

export default async function NewShowroomOrderPage() {
  const supabase = await getSupabaseServerClient()
  const { data } = await supabase
    .from('products')
    .select('id, model_name, category, default_image_url, colors, notes, is_active, created_at')
    .eq('is_active', true)
    .order('category')
    .order('model_name')
    .limit(300)
  const products = (data ?? []) as Product[]

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <Link href="/admin420/show-room-orders" className="inline-flex items-center gap-1 text-sm text-stone-500 hover:text-stone-800 mb-4">
          <ChevronLeft className="w-4 h-4" /> Back to Show-Room Orders
        </Link>
        <h1 className="text-2xl font-bold text-stone-900">New Showroom Order</h1>
        <p className="text-stone-500 text-sm mt-1">Add items with their approximate Turkey costs.</p>
      </div>
      <ShowroomOrderForm products={products} basePath="/admin420/show-room-orders" />
    </div>
  )
}
