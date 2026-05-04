'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Package, Factory, Truck, Loader2 } from 'lucide-react'
import { StatusUpdateModal } from './StatusUpdateModal'
import { generateFactoryPDF } from '@/lib/pdf/generateFactoryPDF'
import { toast } from 'sonner'
import type { Order } from '@/types'

interface Props { order: Order }

function openBase64PDF(base64: string, filename: string) {
  const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0))
  const blob = new Blob([bytes], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 10000)
}

export function FactoryOrderActions({ order }: Props) {
  const [statusModal, setStatusModal] = useState<'order' | 'factory' | 'delivery' | null>(null)
  const [isPdfPending, startPdfTransition] = useTransition()

  function handleFactoryPdf() {
    startPdfTransition(async () => {
      toast.loading('Generating Factory PDF...')
      const result = await generateFactoryPDF(order.id)
      toast.dismiss()
      if (result.error) { toast.error(result.error); return }
      openBase64PDF(result.base64!, result.filename!)
      toast.success('Factory PDF ready')
    })
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={() => setStatusModal('order')}>
          <Package className="w-3.5 h-3.5 mr-1.5" /> Order Status
        </Button>
        <Button variant="outline" size="sm" onClick={() => setStatusModal('factory')}>
          <Factory className="w-3.5 h-3.5 mr-1.5" /> Factory Status
        </Button>
        <Button variant="outline" size="sm" onClick={() => setStatusModal('delivery')}>
          <Truck className="w-3.5 h-3.5 mr-1.5" /> Delivery Status
        </Button>
        <Button
          size="sm"
          onClick={handleFactoryPdf}
          disabled={isPdfPending}
          className="bg-blue-600 hover:bg-blue-700 text-white border-0"
        >
          {isPdfPending
            ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
            : <Factory className="w-3.5 h-3.5 mr-1.5" />
          }
          Factory PDF
        </Button>
      </div>

      {statusModal && (
        <StatusUpdateModal
          open={true}
          onClose={() => setStatusModal(null)}
          orderId={order.id}
          type={statusModal}
          currentStatus={
            statusModal === 'order' ? order.order_status :
            statusModal === 'factory' ? (order.factory_status ?? 'not_sent') :
            (order.delivery_status ?? 'not_scheduled')
          }
        />
      )}
    </>
  )
}
