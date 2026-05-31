export type UserRole = 'admin' | 'staff'

export type ProductCategory =
  | 'Sofa'
  | 'Corner Sofa'
  | 'Dining Table'
  | 'Coffee Table'
  | 'TV Table'
  | 'Side Table'
  | 'Dining Chair'
  | 'Bed'
  | 'Other'

export type OrderStatus =
  | 'draft'
  | 'sent_to_factory'
  | 'confirmed_by_factory'
  | 'in_production'
  | 'ready'
  | 'scheduled_for_delivery'
  | 'delivered'
  | 'completed'
  | 'cancelled'

export type FactoryStatus =
  | 'not_sent'
  | 'sent'
  | 'accepted'
  | 'in_production'
  | 'finished'

export type DeliveryStatus =
  | 'not_scheduled'
  | 'scheduled'
  | 'out_for_delivery'
  | 'delivered'

export type PaymentStatus = 'unpaid' | 'partially_paid' | 'paid'

export type PaymentMethod = 'cash' | 'bank_transfer' | 'installment' | 'other'

export type OrderSource = 'depot' | 'turkey' | 'showroom'

export interface Profile {
  id: string
  full_name: string | null
  role: UserRole
  created_at: string
}

export interface Customer {
  id: string
  name: string
  phone: string | null
  email: string | null
  address: string | null
  city: string | null
  postal_code: string | null
  notes: string | null
  created_at: string
}

export interface Product {
  id: string
  model_name: string
  category: ProductCategory
  default_image_url: string | null
  colors: string[]
  notes: string | null
  is_active: boolean
  created_at: string
}

export interface Order {
  id: string
  order_number: string
  order_month: string
  monthly_sequence: number
  customer_id: string | null
  order_date: string
  total_price: number
  down_payment: number
  remaining_balance: number
  payment_status: PaymentStatus
  payment_method: PaymentMethod | null
  payment_notes: string | null
  order_status: OrderStatus
  factory_status: FactoryStatus | null
  delivery_status: DeliveryStatus | null
  expected_delivery_date: string | null
  delivery_address: string | null
  internal_notes: string | null
  factory_notes: string | null
  pdf_url: string | null
  order_source: OrderSource | null
  created_by: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
  customer?: Customer
  order_items?: OrderItem[]
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string | null
  model_name: string
  category: string
  sofa_configuration: string | null
  color: string | null
  quantity: number
  image_url: string | null
  unit_price: number
  product_cost?: number
  logistics_cost?: number
  customization_note: string | null
  created_at: string
  product?: Product
}

export interface Payment {
  id: string
  order_id: string
  amount: number
  payment_method: PaymentMethod | null
  payment_date: string
  notes: string | null
  created_at: string
}

export interface OrderStatusHistory {
  id: string
  order_id: string
  old_status: string | null
  new_status: string | null
  field_changed: string
  note: string | null
  changed_by: string | null
  created_at: string
  profile?: Pick<Profile, 'full_name'>
}

// Form types
export interface OrderItemFormValues {
  product_id: string
  model_name: string
  category: string
  sofa_configuration: string
  color: string
  quantity: number
  image_url: string
  unit_price: number
  product_cost: number
  logistics_cost: number
  customization_note: string
}

export interface ShowroomNote {
  id: string
  title: string
  content: string
  created_by: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface OrderFormValues {
  customer_id: string
  customer_name: string
  customer_phone: string
  customer_address: string
  order_date: string
  items: OrderItemFormValues[]
  total_price: number
  down_payment: number
  payment_method: string
  payment_notes: string
  factory_status: string
  delivery_status: string
  expected_delivery_date: string
  delivery_address: string
  internal_notes: string
  factory_notes: string
  order_source: string
}

// Dashboard stats
export interface DashboardStats {
  totalOrders: number
  draftOrders: number
  sentToFactory: number
  inProduction: number
  readyOrders: number
  scheduledForDelivery: number
  deliveredOrders: number
  completedOrders: number
  cancelledOrders: number
  unpaidOrders: number
  partiallyPaidOrders: number
  paidOrders: number
  totalRevenue: number
  totalDownPayments: number
  totalRemaining: number
}
