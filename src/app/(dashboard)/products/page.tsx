'use client'

import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ProductModal } from '@/components/products/ProductModal'
import { getProductImage, PRODUCT_IMAGE_SIZES } from '@/lib/productImages'
import { PRODUCT_CATEGORIES } from '@/lib/constants'
import { Plus, Search, Pencil, Package } from 'lucide-react'
import type { Product } from '@/types'
import Image from 'next/image'

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [visibleCount, setVisibleCount] = useState(40)
  const deferredSearch = useDeferredValue(search)

  async function fetchProducts() {
    const supabase = getSupabaseBrowserClient()
    const { data } = await supabase
      .from('products')
      .select('id, model_name, category, default_image_url, colors, notes, is_active, created_at')
      .order('category')
      .order('model_name')
      .limit(300)
    setProducts((data as Product[]) ?? [])
    setLoading(false)
  }

  useEffect(() => { fetchProducts() }, [])

  useEffect(() => { setVisibleCount(40) }, [deferredSearch, categoryFilter])

  const filtered = useMemo(() => products.filter(p => {
    const matchSearch = !deferredSearch || p.model_name.toLowerCase().includes(deferredSearch.toLowerCase())
    const matchCat = !categoryFilter || p.category === categoryFilter
    return matchSearch && matchCat
  }), [products, deferredSearch, categoryFilter])

  const visibleProducts = filtered.slice(0, visibleCount)

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Products</h1>
          <p className="text-stone-500 text-sm mt-1">{products.length} products in catalog</p>
        </div>
        <Button className="bg-stone-900 hover:bg-stone-800" onClick={() => { setEditing(null); setModalOpen(true) }}>
          <Plus className="w-4 h-4 mr-2" /> Add Product
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <Input placeholder="Search models..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select
          className="h-10 px-3 border border-stone-200 rounded-lg text-sm text-stone-700 bg-white focus:outline-none focus:ring-2 focus:ring-stone-300"
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value)}
        >
          <option value="">All Categories</option>
          {PRODUCT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-stone-100 overflow-hidden animate-pulse">
              <div className="aspect-[4/3] bg-stone-200" />
              <div className="p-3 space-y-2">
                <div className="h-4 bg-stone-200 rounded w-3/4" />
                <div className="h-3 bg-stone-100 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-stone-400">
          <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No products found</p>
          <p className="text-sm mt-1">Add your first product or adjust filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {visibleProducts.map(product => (
            <div key={product.id} className="bg-white rounded-xl border border-stone-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow group">
              <div className="aspect-[4/3] bg-stone-50 relative overflow-hidden">
                <Image
                  src={getProductImage(product.model_name, product.default_image_url)}
                  alt={product.model_name}
                  fill
                  sizes={PRODUCT_IMAGE_SIZES.card}
                  className="object-cover"
                />
                {!product.is_active && (
                  <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                    <span className="text-xs font-medium text-stone-500 bg-white px-2 py-1 rounded">Inactive</span>
                  </div>
                )}
              </div>
              <div className="p-3">
                <p className="font-semibold text-stone-800 text-sm truncate">{product.model_name}</p>
                <p className="text-xs text-stone-400 mt-0.5">{product.category}</p>
                {product.colors && product.colors.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {product.colors.slice(0, 3).map(c => (
                      <span key={c} className="text-xs bg-stone-100 text-stone-600 px-1.5 py-0.5 rounded">{c}</span>
                    ))}
                    {product.colors.length > 3 && (
                      <span className="text-xs text-stone-400">+{product.colors.length - 3}</span>
                    )}
                  </div>
                )}
                <button
                  onClick={() => { setEditing(product); setModalOpen(true) }}
                  className="mt-2 w-full flex items-center justify-center gap-1.5 text-xs text-stone-500 hover:text-stone-900 hover:bg-stone-50 rounded py-1.5 transition-colors border border-transparent hover:border-stone-200"
                >
                  <Pencil className="w-3 h-3" /> Edit
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && visibleProducts.length < filtered.length && (
        <div className="flex justify-center">
          <Button variant="outline" onClick={() => setVisibleCount(c => c + 40)}>
            Load more products
          </Button>
        </div>
      )}

      <ProductModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        product={editing}
        onSaved={fetchProducts}
      />
    </div>
  )
}
