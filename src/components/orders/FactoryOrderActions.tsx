'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Package, Factory, Truck } from 'lucide-react'
import { StatusUpdateModal } from './StatusUpdateModal'
import type { Order } from '@/types'

interface Props { order: Order }

export function FactoryOrderActions({ order }: Props) {
  const [statusModal, setStatusModal] = useState<'order' | 'factory' | 'delivery' | null>(null)

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
