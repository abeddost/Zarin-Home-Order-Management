'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Loader2, CreditCard, Package, Factory, Truck, FileText, Trash2 } from 'lucide-react'
import { StatusUpdateModal } from './StatusUpdateModal'
import { PaymentModal } from './PaymentModal'
import { generateAndUploadPDF } from '@/lib/pdf/generatePDF'
import { generateAndUploadFactoryPDF } from '@/lib/pdf/generateFactoryPDF'
import { deleteOrder } from '@/actions/orders'
import type { Order } from '@/types'

interface Props {
  order: Order
  trueRemaining: number
  showDelete?: boolean
  showFactoryPDF?: boolean
}

export function OrderDetailActions({
  order,
  trueRemaining,
  showDelete = true,
  showFactoryPDF = true,
}: Props) {
  const router = useRouter()
  const [statusModal, setStatusModal] = useState<'order' | 'factory' | 'delivery' | null>(null)
  const [paymentModal, setPaymentModal] = useState(false)
  const [deleteModal, setDeleteModal] = useState(false)
  const [isPdfPending, startPdfTransition] = useTransition()
  const [isFactoryPdfPending, startFactoryPdfTransition] = useTransition()
  const [isDeleting, startDeleteTransition] = useTransition()

  function handleCustomerPdf() {
    startPdfTransition(async () => {
      toast.loading('Generating Customer PDF...')
      const result = await generateAndUploadPDF(order.id)
      toast.dismiss()
      if (result.error) { toast.error(result.error); return }
      toast.success('Customer PDF generated!')
      if (result.url) window.open(result.url, '_blank')
    })
  }

  function handleFactoryPdf() {
    startFactoryPdfTransition(async () => {
      toast.loading('Generating Factory PDF...')
      const result = await generateAndUploadFactoryPDF(order.id)
      toast.dismiss()
      if (result.error) { toast.error(result.error); return }
      toast.success('Factory PDF generated!')
      if (result.url) window.open(result.url, '_blank')
    })
  }

  function handleDelete() {
    startDeleteTransition(async () => {
      const result = await deleteOrder(order.id)
      if (result.error) { toast.error(result.error); return }
      toast.success(`Order #${order.order_number} deleted`)
      router.push('/admin420/orders')
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
        <Button variant="outline" size="sm" onClick={() => setPaymentModal(true)}>
          <CreditCard className="w-3.5 h-3.5 mr-1.5" /> Add Payment
        </Button>
        <Button variant="outline" size="sm" onClick={handleCustomerPdf} disabled={isPdfPending}>
          {isPdfPending
            ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
            : <FileText className="w-3.5 h-3.5 mr-1.5" />
          }
          Customer PDF
        </Button>
        {showFactoryPDF && (
          <Button variant="outline" size="sm" onClick={handleFactoryPdf} disabled={isFactoryPdfPending}>
            {isFactoryPdfPending
              ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
              : <Factory className="w-3.5 h-3.5 mr-1.5" />
            }
            Factory PDF
          </Button>
        )}
        {showDelete && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDeleteModal(true)}
            className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 hover:border-red-300"
          >
            <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Delete Order
          </Button>
        )}
      </div>

      {/* Delete confirmation dialog */}
      {showDelete && (
        <Dialog open={deleteModal} onOpenChange={setDeleteModal}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Delete Order #{order.order_number}?</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-stone-500 mt-1">
              This will permanently delete the order, all its items, and payment records. This cannot be undone.
            </p>
            <div className="flex gap-3 mt-4">
              <Button variant="outline" className="flex-1" onClick={() => setDeleteModal(false)} disabled={isDeleting}>
                Cancel
              </Button>
              <Button
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                Delete Order
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

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

      <PaymentModal
        open={paymentModal}
        onClose={() => setPaymentModal(false)}
        orderId={order.id}
        remainingBalance={trueRemaining}
      />
    </>
  )
}
