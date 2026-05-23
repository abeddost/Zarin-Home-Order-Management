import { redirect } from 'next/navigation'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/layout/Sidebar'
import { getUserAccess } from '@/lib/access'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')
  const access = getUserAccess(user)
  if (access === 'admin') redirect('/admin420')

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar access={access} />
      <main className="lg:pl-56">
        <div className="pt-14 lg:pt-0">
          {children}
        </div>
      </main>
    </div>
  )
}
