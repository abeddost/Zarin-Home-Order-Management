import { redirect } from 'next/navigation'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { FactorySidebar } from '@/components/layout/FactorySidebar'
import { getUserAccess } from '@/lib/access'

export default async function FactoryLayout({ children }: { children: React.ReactNode }) {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const access = getUserAccess(user)
  if (access === 'seller') redirect('/orders')

  return (
    <div className="min-h-screen bg-gray-50">
      <FactorySidebar access={access} />
      <main className="lg:pl-56">
        <div className="pt-14 lg:pt-0">
          {children}
        </div>
      </main>
    </div>
  )
}
