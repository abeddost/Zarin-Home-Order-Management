import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

type Role = 'admin' | 'seller' | 'factory'

function roleHome(role: Role): string {
  if (role === 'admin') return '/admin420'
  if (role === 'factory') return '/factory'
  return '/orders'
}

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
    const role = (user.user_metadata?.role as Role) ?? 'seller'
    const url = request.nextUrl.clone()
    url.pathname = roleHome(role)
    return NextResponse.redirect(url)
  }

  if (user) {
    const role = (user.user_metadata?.role as Role) ?? 'seller'
    const url = request.nextUrl.clone()

    // Guard /admin420/* — admin only
    if (pathname.startsWith('/admin420') && role !== 'admin') {
      url.pathname = roleHome(role)
      return NextResponse.redirect(url)
    }

    // Guard /factory/* — factory only
    if (pathname.startsWith('/factory') && role !== 'factory') {
      url.pathname = roleHome(role)
      return NextResponse.redirect(url)
    }

    // Guard seller routes (/, /orders, /products, /customers) — not for factory or admin
    const isSellerRoute = pathname === '/' ||
      pathname.startsWith('/orders') ||
      pathname.startsWith('/products') ||
      pathname.startsWith('/customers')
    if (isSellerRoute && role === 'factory') {
      url.pathname = '/factory'
      return NextResponse.redirect(url)
    }
    if (isSellerRoute && role === 'admin') {
      url.pathname = '/admin420'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|placeholder-product.png).*)'],
}
