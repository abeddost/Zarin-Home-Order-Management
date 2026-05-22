'use server'

import { getSupabaseServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getUserAccess } from '@/lib/access'
import type { OrderItemFormValues, PaymentMethod, OrderStatus, FactoryStatus, DeliveryStatus } from '@/types'

export interface CreateOrderInput {
  customer_id: string
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
  order_source?: string
}

async function canAccessOrderForMutation(
  supabase: Awaited<ReturnType<typeof getSupabaseServerClient>>,
  orderId: string
): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  if (getUserAccess(user) !== 'factory-products') return true

  const { data, error } = await supabase
    .from('orders')
    .select('order_source')
    .eq('id', orderId)
    .single()

  return !error && data?.order_source === 'turkey'
}

export async function createOrder(input: CreateOrderInput): Promise<{ orderId?: string; orderNumber?: string; error?: string }> {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: numData, error: numError } = await supabase
    .rpc('generate_order_number', { p_order_date: input.order_date })

  if (numError || !numData?.[0]) return { error: numError?.message ?? 'Failed to generate order number' }

  const { order_number, order_month, monthly_sequence } = numData[0]

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      order_number,
      order_month,
      monthly_sequence,
      customer_id: input.customer_id || null,
      order_date: input.order_date,
      total_price: input.total_price,
      down_payment: input.down_payment,
      payment_method: input.payment_method || null,
      payment_notes: input.payment_notes || null,
      factory_status: input.factory_status || 'not_sent',
      delivery_status: input.delivery_status || 'not_scheduled',
      expected_delivery_date: input.expected_delivery_date || null,
      delivery_address: input.delivery_address || null,
      internal_notes: input.internal_notes || null,
      factory_notes: input.factory_notes || null,
      order_source: input.order_source || null,
      order_status: 'draft',
      created_by: user.id,
    })
    .select()
    .single()

  if (orderError) return { error: orderError.message }

  if (input.items.length > 0) {
    const { error: itemsError } = await supabase.from('order_items').insert(
      input.items.map(item => ({
        order_id: order.id,
        product_id: item.product_id || null,
        model_name: item.model_name,
        category: item.category,
        sofa_configuration: item.sofa_configuration || null,
        color: item.color || null,
        quantity: item.quantity,
        image_url: item.image_url || null,
        unit_price: item.unit_price,
        customization_note: item.customization_note || null,
      }))
    )
    if (itemsError) return { error: itemsError.message }
  }

  revalidatePath('/orders')

  return { orderId: order.id, orderNumber: order_number }
}

export async function updateOrderStatus(orderId: string, status: OrderStatus): Promise<{ error?: string }> {
  const supabase = await getSupabaseServerClient()
  if (!(await canAccessOrderForMutation(supabase, orderId))) return { error: 'Not allowed to update this order' }
  const { error } = await supabase.from('orders').update({ order_status: status }).eq('id', orderId)
  if (error) return { error: error.message }
  revalidatePath('/orders')
  revalidatePath(`/orders/${orderId}`)
  return {}
}

export async function updateFactoryStatus(
  orderId: string,
  status: FactoryStatus,
  notes?: string
): Promise<{ error?: string }> {
  const supabase = await getSupabaseServerClient()
  if (!(await canAccessOrderForMutation(supabase, orderId))) return { error: 'Not allowed to update this order' }
  const payload: Record<string, unknown> = { factory_status: status }
  if (notes !== undefined) payload.factory_notes = notes
  const { error } = await supabase.from('orders').update(payload).eq('id', orderId)
  if (error) return { error: error.message }
  revalidatePath(`/orders/${orderId}`)
  return {}
}

export async function updateDeliveryStatus(
  orderId: string,
  status: DeliveryStatus,
  date?: string,
  address?: string
): Promise<{ error?: string }> {
  const supabase = await getSupabaseServerClient()
  if (!(await canAccessOrderForMutation(supabase, orderId))) return { error: 'Not allowed to update this order' }
  const payload: Record<string, unknown> = { delivery_status: status }
  if (date !== undefined) payload.expected_delivery_date = date || null
  if (address !== undefined) payload.delivery_address = address || null
  const { error } = await supabase.from('orders').update(payload).eq('id', orderId)
  if (error) return { error: error.message }
  revalidatePath(`/orders/${orderId}`)
  return {}
}

export async function addPayment(
  orderId: string,
  amount: number,
  method: PaymentMethod | string,
  date: string,
  notes?: string
): Promise<{ error?: string }> {
  const supabase = await getSupabaseServerClient()
  const { error } = await supabase.from('payments').insert({
    order_id: orderId,
    amount,
    payment_method: method || null,
    payment_date: date,
    notes: notes || null,
  })
  if (error) return { error: error.message }
  revalidatePath(`/orders/${orderId}`)
  return {}
}

export async function saveOrderPdfUrl(orderId: string, pdfUrl: string): Promise<{ error?: string }> {
  const supabase = await getSupabaseServerClient()
  const { error } = await supabase.from('orders').update({ pdf_url: pdfUrl }).eq('id', orderId)
  if (error) return { error: error.message }
  revalidatePath(`/orders/${orderId}`)
  return {}
}

export async function updateOrderDetails(
  orderId: string,
  fields: Partial<{
    internal_notes: string
    factory_notes: string
    delivery_address: string
    expected_delivery_date: string
    order_status: OrderStatus
  }>
): Promise<{ error?: string }> {
  const supabase = await getSupabaseServerClient()
  const { error } = await supabase.from('orders').update(fields).eq('id', orderId)
  if (error) return { error: error.message }
  revalidatePath(`/orders/${orderId}`)
  revalidatePath('/orders')
  return {}
}

export async function createCustomer(payload: {
  name: string
  phone?: string
  email?: string
  address?: string
  city?: string
  postal_code?: string
}): Promise<{ customerId?: string; error?: string }> {
  const supabase = await getSupabaseServerClient()
  const { data, error } = await supabase
    .from('customers')
    .insert({
      name: payload.name.trim(),
      phone: payload.phone?.trim() || null,
      email: payload.email?.trim() || null,
      address: payload.address?.trim() || null,
      city: payload.city?.trim() || null,
      postal_code: payload.postal_code?.trim() || null,
    })
    .select('id')
    .single()
  if (error) return { error: error.message }
  revalidatePath('/customers')
  return { customerId: data.id }
}

export async function updatePayment(
  paymentId: string,
  orderId: string,
  data: { amount: number; payment_method: string; payment_date: string; notes?: string }
): Promise<{ error?: string }> {
  const supabase = await getSupabaseServerClient()
  const { error } = await supabase.from('payments').update({
    amount: data.amount,
    payment_method: data.payment_method || null,
    payment_date: data.payment_date,
    notes: data.notes || null,
  }).eq('id', paymentId)
  if (error) return { error: error.message }
  revalidatePath(`/orders/${orderId}`)
  return {}
}

export async function deletePayment(
  paymentId: string,
  orderId: string
): Promise<{ error?: string }> {
  const supabase = await getSupabaseServerClient()
  const { error } = await supabase.from('payments').delete().eq('id', paymentId)
  if (error) return { error: error.message }
  revalidatePath(`/orders/${orderId}`)
  return {}
}

export async function deleteOrder(orderId: string): Promise<{ error?: string }> {
  const supabase = await getSupabaseServerClient()
  const { error } = await supabase
    .from('orders')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', orderId)
  if (error) return { error: error.message }
  revalidatePath('/orders')
  revalidatePath('/admin420/orders')
  return {}
}

export async function bulkDeleteOrders(orderIds: string[]): Promise<{ error?: string }> {
  if (orderIds.length === 0) return {}
  const supabase = await getSupabaseServerClient()
  const { error } = await supabase
    .from('orders')
    .update({ deleted_at: new Date().toISOString() })
    .in('id', orderIds)
  if (error) return { error: error.message }
  revalidatePath('/orders')
  revalidatePath('/admin420/orders')
  return {}
}

export async function restoreOrder(orderId: string): Promise<{ error?: string }> {
  const supabase = await getSupabaseServerClient()
  const { error } = await supabase
    .from('orders')
    .update({ deleted_at: null })
    .eq('id', orderId)
  if (error) return { error: error.message }
  revalidatePath('/orders')
  revalidatePath('/admin420/orders')
  return {}
}

export async function updateOrder(
  orderId: string,
  input: CreateOrderInput
): Promise<{ error?: string }> {
  const supabase = await getSupabaseServerClient()

  const { error: orderError } = await supabase.from('orders').update({
    customer_id: input.customer_id || null,
    order_date: input.order_date,
    total_price: input.total_price,
    down_payment: input.down_payment,
    payment_method: input.payment_method || null,
    payment_notes: input.payment_notes || null,
    factory_status: input.factory_status || 'not_sent',
    delivery_status: input.delivery_status || 'not_scheduled',
    expected_delivery_date: input.expected_delivery_date || null,
    delivery_address: input.delivery_address || null,
    internal_notes: input.internal_notes || null,
    factory_notes: input.factory_notes || null,
    order_source: input.order_source || null,
  }).eq('id', orderId)

  if (orderError) return { error: orderError.message }

  const { error: deleteError } = await supabase
    .from('order_items').delete().eq('order_id', orderId)
  if (deleteError) return { error: deleteError.message }

  if (input.items.length > 0) {
    const { error: insertError } = await supabase.from('order_items').insert(
      input.items.map(item => ({
        order_id: orderId,
        product_id: item.product_id || null,
        model_name: item.model_name,
        category: item.category,
        sofa_configuration: item.sofa_configuration || null,
        color: item.color || null,
        quantity: item.quantity,
        image_url: item.image_url || null,
        unit_price: item.unit_price,
        customization_note: item.customization_note || null,
      }))
    )
    if (insertError) return { error: insertError.message }
  }

  revalidatePath('/orders')
  revalidatePath(`/orders/${orderId}`)

  return {}
}
