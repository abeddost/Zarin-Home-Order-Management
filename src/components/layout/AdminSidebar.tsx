'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { LayoutDashboard, ShoppingBag, Users, Package, LogOut, Menu, X, Store, StickyNote } from 'lucide-react'
import { useState } from 'react'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

const navItems = [
  { href: '/admin420',                   label: 'Dashboard',     icon: LayoutDashboard },
  { href: '/admin420/orders',            label: 'Orders',        icon: ShoppingBag },
  { href: '/admin420/show-room-orders',  label: 'Show-Room',     icon: Store },
  { href: '/admin420/show-room-orders/notes', label: 'SR Notes', icon: StickyNote },
  { href: '/admin420/customers',         label: 'Customers',     icon: Users },
  { href: '/admin420/products',          label: 'Products',      icon: Package },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)

  async function handleLogout() {
    const supabase = getSupabaseBrowserClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const NavContent = () => (
    <>
      <div className="px-6 py-5 border-b border-stone-200">
        <h1 className="text-lg font-bold text-stone-900 tracking-tight">Zarin Home</h1>
        <p className="text-xs text-stone-400 mt-0.5">Admin Panel</p>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = href === '/admin420' ? pathname === '/admin420' : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                active ? 'bg-stone-900 text-white' : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>
      <div className="px-3 py-4 border-t border-stone-200">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-stone-600 hover:bg-red-50 hover:text-red-600 transition-colors w-full"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          Sign Out
        </button>
      </div>
    </>
  )

  return (
    <>
      <aside className="hidden lg:flex lg:flex-col lg:w-56 lg:fixed lg:inset-y-0 lg:bg-white lg:border-r lg:border-stone-200 lg:z-30">
        <NavContent />
      </aside>
      <div className="lg:hidden fixed top-0 left-0 right-0 z-30 bg-white border-b border-stone-200 flex items-center justify-between px-4 h-14">
        <h1 className="text-base font-bold text-stone-900">Zarin Home</h1>
        <Button variant="ghost" size="icon" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
      </div>
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-20 bg-black/30" onClick={() => setMobileOpen(false)}>
          <div className="fixed left-0 top-0 bottom-0 w-64 bg-white flex flex-col shadow-xl" onClick={e => e.stopPropagation()}>
            <NavContent />
          </div>
        </div>
      )}
    </>
  )
}
