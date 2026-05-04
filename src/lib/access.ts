type AppUser = {
  email?: string | null
  user_metadata?: Record<string, unknown> | null
}

export type AppAccess = 'admin' | 'factory-products' | 'seller'

function userIdentity(user: AppUser | null | undefined): string {
  const metadata = user?.user_metadata ?? {}
  return [
    user?.email,
    metadata.full_name,
    metadata.name,
    metadata.display_name,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
}

export function getUserAccess(user: AppUser | null | undefined): AppAccess {
  const identity = userIdentity(user)

  if (identity.includes('abed')) return 'admin'
  if (identity.includes('hamid')) return 'factory-products'

  return 'seller'
}

export function homeForAccess(access: AppAccess): string {
  if (access === 'admin') return '/admin420'
  if (access === 'factory-products') return '/factory'
  return '/orders'
}

export function canAccessPath(access: AppAccess, pathname: string): boolean {
  if (access === 'admin') return true

  const isFactoryRoute = pathname === '/factory' || pathname.startsWith('/factory/')
  const isProductsRoute = pathname === '/products' || pathname.startsWith('/products/')
  const isSellerRoute =
    pathname === '/' ||
    pathname === '/orders' ||
    pathname.startsWith('/orders/') ||
    pathname === '/customers' ||
    pathname.startsWith('/customers/') ||
    isProductsRoute

  if (access === 'factory-products') return isFactoryRoute || isProductsRoute

  return isSellerRoute
}
