import type { OrderStatus, FactoryStatus, DeliveryStatus, PaymentStatus, ProductCategory } from '@/types'

export const PRODUCT_CATEGORIES: ProductCategory[] = [
  'Sofa',
  'Corner Sofa',
  'Dining Table',
  'Coffee Table',
  'TV Table',
  'Side Table',
  'Dining Chair',
  'Bed',
  'Other',
]

export const SOFA_CATEGORIES = ['Sofa', 'Corner Sofa']

export const ORDER_STATUSES: { value: OrderStatus; label: string; labelDe: string; color: string }[] = [
  { value: 'draft',                  label: 'Draft',                  labelDe: 'Entwurf',           color: 'bg-gray-100 text-gray-700' },
  { value: 'sent_to_factory',        label: 'Sent to Factory',        labelDe: 'An Fabrik gesendet', color: 'bg-blue-100 text-blue-700' },
  { value: 'confirmed_by_factory',   label: 'Confirmed by Factory',   labelDe: 'Bestätigt',          color: 'bg-indigo-100 text-indigo-700' },
  { value: 'in_production',          label: 'In Production',          labelDe: 'In Produktion',      color: 'bg-yellow-100 text-yellow-700' },
  { value: 'ready',                  label: 'Ready',                  labelDe: 'Fertig',             color: 'bg-emerald-100 text-emerald-700' },
  { value: 'scheduled_for_delivery', label: 'Scheduled for Delivery', labelDe: 'Lieferung geplant',  color: 'bg-cyan-100 text-cyan-700' },
  { value: 'delivered',              label: 'Delivered',              labelDe: 'Geliefert',          color: 'bg-green-100 text-green-700' },
  { value: 'completed',              label: 'Completed',              labelDe: 'Abgeschlossen',      color: 'bg-green-200 text-green-800' },
  { value: 'cancelled',              label: 'Cancelled',              labelDe: 'Storniert',          color: 'bg-red-100 text-red-700' },
]

export const FACTORY_STATUSES: { value: FactoryStatus; label: string; color: string }[] = [
  { value: 'not_sent',      label: 'Not Sent',       color: 'bg-gray-100 text-gray-600' },
  { value: 'sent',          label: 'Sent',           color: 'bg-blue-100 text-blue-700' },
  { value: 'accepted',      label: 'Accepted',       color: 'bg-indigo-100 text-indigo-700' },
  { value: 'in_production', label: 'In Production',  color: 'bg-yellow-100 text-yellow-700' },
  { value: 'finished',      label: 'Finished',       color: 'bg-green-100 text-green-700' },
]

export const DELIVERY_STATUSES: { value: DeliveryStatus; label: string; color: string }[] = [
  { value: 'not_scheduled',    label: 'Not Scheduled',    color: 'bg-gray-100 text-gray-600' },
  { value: 'scheduled',        label: 'Scheduled',        color: 'bg-blue-100 text-blue-700' },
  { value: 'out_for_delivery', label: 'Out for Delivery', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'delivered',        label: 'Delivered',        color: 'bg-green-100 text-green-700' },
]

export const PAYMENT_STATUSES: { value: PaymentStatus; label: string; color: string }[] = [
  { value: 'unpaid',         label: 'Unpaid',         color: 'bg-red-100 text-red-700' },
  { value: 'partially_paid', label: 'Partially Paid', color: 'bg-orange-100 text-orange-700' },
  { value: 'paid',           label: 'Paid',           color: 'bg-green-100 text-green-700' },
]

export const PAYMENT_METHODS = [
  { value: 'cash',          label: 'Cash / Bar' },
  { value: 'bank_transfer', label: 'Bank Transfer / Überweisung' },
  { value: 'installment',   label: 'Installment / Ratenzahlung' },
  { value: 'other',         label: 'Other / Sonstiges' },
]

export const SOFA_CONFIGURATIONS = [
  '3+3+1+1',
  '3+3+1',
  '3+2+1+1',
  '3+2+1',
  '3+2',
  '3+1+1',
  '3+3',
  '2+2+1',
  'L-Shape',
  'U-Shape',
  'Custom',
]

export const COMPANY_INFO = {
  name: 'Zarin Home',
  address: 'Musterstraße 1',
  city: '12345 Berlin',
  phone: '+49 000 000 0000',
  email: 'info@zarinhome.de',
}
