'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { RotateCcw, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { restoreOrder } from '@/actions/orders'

export function RestoreOrderButton({ orderId }: { orderId: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleRestore() {
    setLoading(true)
    const result = await restoreOrder(orderId)
    setLoading(false)
    if (result.error) { toast.error(result.error); return }
    toast.success('Order restored successfully')
    router.refresh()
  }

  return (
    <Button onClick={handleRestore} disabled={loading} className="bg-emerald-700 hover:bg-emerald-800">
      {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RotateCcw className="w-4 h-4 mr-2" />}
      Restore Order
    </Button>
  )
}
