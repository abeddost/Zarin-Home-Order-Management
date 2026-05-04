import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { canAccessPath, getUserAccess, homeForAccess } from '@/lib/access'

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const pathname = request.nextUrl.pathname
  const isLoginPage = pathname === '/login'

  // Unauthenticated → send to login
  if (!user && !isLoginPage) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Authenticated on login → send to role home
  if (user && isLoginPage) {
    const role = getUserAccess(user)
    const url = request.nextUrl.clone()
    url.pathname = homeForAccess(role)
    return NextResponse.redirect(url)
  }

  if (user) {
    const access = getUserAccess(user)
    if (!canAccessPath(access, pathname)) {
      const url = request.nextUrl.clone()
      url.pathname = homeForAccess(access)
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/',
    '/login',
    '/orders/:path*',
    '/customers/:path*',
    '/products/:path*',
    '/admin420/:path*',
    '/factory/:path*',
  ],
}
