'use client'

import dynamic from 'next/dynamic'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Loader2, Download } from 'lucide-react'
import type { Order } from '@/types'

const PDFViewer = dynamic(
  () => import('@react-pdf/renderer').then(m => m.PDFViewer),
  { ssr: false, loading: () => <div className="flex items-center justify-center h-full"><Loader2 className="w-6 h-6 animate-spin text-stone-400" /></div> }
)

const OrderPDFDynamic = dynamic(
  () => import('./OrderPDF').then(m => m.OrderPDF),
  { ssr: false }
)

interface Props {
  open: boolean
  onClose: () => void
  order: Order
}

export function PDFPreviewModal({ open, onClose, order }: Props) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl h-[85vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-5 pb-3 border-b border-stone-100">
          <div className="flex items-center justify-between">
            <DialogTitle>PDF Preview — Order #{order.order_number}</DialogTitle>
            {order.pdf_url && (
              <a href={order.pdf_url} download target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm">
                  <Download className="w-3.5 h-3.5 mr-1.5" /> Download
                </Button>
              </a>
            )}
          </div>
        </DialogHeader>
        <div className="flex-1 overflow-hidden">
          <PDFViewer width="100%" height="100%" showToolbar={false}>
            <OrderPDFDynamic order={order} />
          </PDFViewer>
        </div>
      </DialogContent>
    </Dialog>
  )
}
