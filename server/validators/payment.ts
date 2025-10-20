import { z } from 'zod'

// Payment method validation
export const PaymentMethodSchema = z.enum(['cod', 'gcash', 'grab_pay', 'card', 'paymaya'])

// Billing details validation
export const BillingDetailsSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  address: z.object({
    line1: z.string().min(1, 'Address line 1 is required'),
    line2: z.string().optional(),
    city: z.string().min(1, 'City is required'),
    state: z.string().min(1, 'State/Province is required'),
    postal_code: z.string().min(1, 'Postal code is required'),
    country: z.string().default('PH')
  }).optional()
})

// Delivery address validation
export const DeliveryAddressSchema = z.object({
  line1: z.string().min(1, 'Delivery address is required'),
  line2: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State/Province is required'),
  postal_code: z.string().min(1, 'Postal code is required'),
  country: z.string().default('PH')
})

// Cart item validation
export const CartItemSchema = z.object({
  product_id: z.string().min(1, 'Product ID is required'),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  price: z.number().min(0.01, 'Price must be greater than 0')
})

// Checkout request validation
export const CheckoutRequestSchema = z.object({
  items: z.array(z.string()).min(1, 'At least one item is required'),
  delivery_address: z.union([
    z.string().min(1, 'Delivery address is required'),
    DeliveryAddressSchema
  ]),
  delivery_address_structured: DeliveryAddressSchema.optional(),
  payment_method: PaymentMethodSchema,
  billing_details: BillingDetailsSchema
})

// Payment intent creation validation
export const PaymentIntentSchema = z.object({
  amount: z.number().min(1, 'Amount must be greater than 0'),
  currency: z.string().default('PHP'),
  description: z.string().min(1, 'Description is required'),
  payment_method: PaymentMethodSchema,
  billing_details: BillingDetailsSchema,
  delivery_address: DeliveryAddressSchema.optional(),
  metadata: z.record(z.any()).optional()
})

// Payment confirmation validation
export const PaymentConfirmationSchema = z.object({
  payment_intent_id: z.string().min(1, 'Payment intent ID is required'),
  source_id: z.string().optional(),
  payment_id: z.string().optional()
})

// Webhook event validation
export const WebhookEventSchema = z.object({
  type: z.string().min(1, 'Event type is required'),
  data: z.object({
    id: z.string(),
    type: z.string(),
    attributes: z.record(z.any())
  }),
  created: z.number()
})

// Payment status update validation
export const PaymentStatusUpdateSchema = z.object({
  payment_id: z.string().min(1, 'Payment ID is required'),
  status: z.enum(['paid', 'failed', 'cancelled', 'refunded']),
  failure_reason: z.string().optional(),
  payment_data: z.record(z.any()).optional()
})

// Refund request validation
export const RefundRequestSchema = z.object({
  payment_id: z.string().min(1, 'Payment ID is required'),
  amount: z.number().min(1, 'Refund amount must be greater than 0').optional(),
  reason: z.string().min(1, 'Refund reason is required')
})

// Payment search/filter validation
export const PaymentFilterSchema = z.object({
  status: z.enum(['pending', 'processing', 'paid', 'failed', 'cancelled', 'refunded']).optional(),
  payment_method: PaymentMethodSchema.optional(),
  date_from: z.string().datetime().optional(),
  date_to: z.string().datetime().optional(),
  buyer_id: z.string().optional(),
  seller_id: z.string().optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20)
})

// Helper functions for validation
export const validateAmount = (amount: number): boolean => {
  return amount > 0 && amount <= 100000000 // Max ₱1,000,000
}

export const validatePhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^(\+63|0)?[0-9]{10}$/
  return phoneRegex.test(phone.replace(/\s/g, ''))
}

export const validatePostalCode = (postalCode: string): boolean => {
  const postalRegex = /^[0-9]{4}$/
  return postalRegex.test(postalCode)
}

export const convertToCentavos = (pesos: number): number => {
  return Math.round(pesos * 100)
}

export const convertFromCentavos = (centavos: number): number => {
  return centavos / 100
}

// Error messages
export const PAYMENT_ERRORS = {
  INVALID_AMOUNT: 'Invalid payment amount',
  INVALID_PAYMENT_METHOD: 'Invalid payment method',
  PAYMENT_FAILED: 'Payment processing failed',
  PAYMENT_CANCELLED: 'Payment was cancelled',
  PAYMENT_EXPIRED: 'Payment has expired',
  INSUFFICIENT_FUNDS: 'Insufficient funds',
  INVALID_CARD: 'Invalid card details',
  NETWORK_ERROR: 'Network error occurred',
  PAYMONGO_ERROR: 'Payment gateway error',
  ORDER_NOT_FOUND: 'Order not found',
  PAYMENT_ALREADY_PROCESSED: 'Payment already processed',
  REFUND_FAILED: 'Refund processing failed',
  INVALID_WEBHOOK: 'Invalid webhook signature'
} as const
