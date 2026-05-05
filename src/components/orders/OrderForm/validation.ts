import { isSofaCategory } from '@/lib/utils'
import type { FormState } from './index'

export function getOrderFormStepErrors(form: FormState, step: number): string[] {
  const errors: string[] = []

  if (step === 0) {
    if (!form.order_date) errors.push('Order date is required.')

    if (form.customer_mode === 'existing') {
      if (!form.customer_id) errors.push('Select a customer.')
    } else {
      if (!form.new_customer_name.trim()) errors.push('Customer name is required.')
      if (!form.new_customer_phone.trim()) errors.push('Customer phone number is required.')
    }
  }

  if (step === 1) {
    const validItems = form.items.filter(item =>
      item.model_name.trim() || item.product_id || item.unit_price > 0
    )

    if (validItems.length === 0) errors.push('Add at least one product.')

    validItems.forEach((item, index) => {
      const label = `Item ${index + 1}`
      if (!item.product_id) errors.push(`${label}: select a product.`)
      if (!item.model_name.trim()) errors.push(`${label}: model name is required.`)
      if (!item.category.trim()) errors.push(`${label}: category is required.`)
      if (item.quantity < 1) errors.push(`${label}: quantity must be at least 1.`)
      if (item.unit_price <= 0) errors.push(`${label}: price must be greater than 0.`)
      if (isSofaCategory(item.category) && !item.sofa_configuration.trim()) {
        errors.push(`${label}: sofa configuration is required.`)
      }
    })
  }

  if (step === 2) {
    if (form.total_price <= 0) errors.push('Total price must be greater than 0.')
    if (form.down_payment < 0) errors.push('Down payment cannot be negative.')
    if (form.down_payment > form.total_price) errors.push('Down payment cannot be higher than total price.')
    if (!form.payment_method) errors.push('Payment method is required.')
  }

  if (step === 3) {
    if (!form.order_source) errors.push('Order source is required.')
    if (!form.expected_delivery_date) errors.push('Expected delivery date is required.')
  }

  return errors
}

export function getAllOrderFormErrors(form: FormState): { step: number; errors: string[] }[] {
  return [0, 1, 2, 3].map(step => ({
    step,
    errors: getOrderFormStepErrors(form, step),
  })).filter(result => result.errors.length > 0)
}

