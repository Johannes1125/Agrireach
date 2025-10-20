import mongoose, { Document, Schema, Types } from 'mongoose'

export type PaymentStatus = 'pending' | 'processing' | 'paid' | 'failed' | 'cancelled' | 'refunded'
export type PaymentMethod = 'cod' | 'gcash' | 'grab_pay' | 'card' | 'paymaya'
export type PaymentType = 'one_time' | 'subscription' | 'refund'

export interface IPayment extends Document {
  // Basic payment info
  buyer_id: Types.ObjectId
  seller_id?: Types.ObjectId // Optional for marketplace orders
  order_id?: Types.ObjectId
  
  // Payment details
  amount: number // Amount in centavos (e.g., 10000 = ₱100.00)
  currency: string // 'PHP'
  description: string
  payment_method: PaymentMethod
  payment_type: PaymentType
  
  // PayMongo integration
  paymongo_payment_intent_id?: string
  paymongo_source_id?: string
  paymongo_payment_id?: string
  paymongo_client_key?: string
  
  // Payment status and tracking
  status: PaymentStatus
  failure_reason?: string
  paid_at?: Date
  failed_at?: Date
  cancelled_at?: Date
  
  // Billing information
  billing_details: {
    name: string
    email: string
    phone?: string
    address?: {
      line1: string
      line2?: string
      city: string
      state: string
      postal_code: string
      country: string
    }
  }
  
  // Delivery information
  delivery_address?: {
    line1: string
    line2?: string
    city: string
    state: string
    postal_code: string
    country: string
  }
  
  // Metadata and tracking
  metadata?: Record<string, any>
  webhook_events?: Array<{
    event_type: string
    event_data: any
    received_at: Date
  }>
  
  // Timestamps
  created_at: Date
  updated_at: Date
  expires_at?: Date
}

const PaymentSchema = new Schema<IPayment>({
  // Basic payment info
  buyer_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  seller_id: { type: Schema.Types.ObjectId, ref: 'User' },
  order_id: { type: Schema.Types.ObjectId, ref: 'Order' },
  
  // Payment details
  amount: { type: Number, required: true, min: 1 },
  currency: { type: String, default: 'PHP', enum: ['PHP'] },
  description: { type: String, required: true },
  payment_method: { 
    type: String, 
    required: true, 
    enum: ['cod', 'gcash', 'grab_pay', 'card', 'paymaya']
  },
  payment_type: { 
    type: String, 
    default: 'one_time', 
    enum: ['one_time', 'subscription', 'refund']
  },
  
  // PayMongo integration
  paymongo_payment_intent_id: { type: String },
  paymongo_source_id: { type: String },
  paymongo_payment_id: { type: String },
  paymongo_client_key: { type: String },
  
  // Payment status and tracking
  status: { 
    type: String, 
    default: 'pending', 
    enum: ['pending', 'processing', 'paid', 'failed', 'cancelled', 'refunded']
  },
  failure_reason: { type: String },
  paid_at: { type: Date },
  failed_at: { type: Date },
  cancelled_at: { type: Date },
  
  // Billing information
  billing_details: {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String },
    address: {
      line1: { type: String },
      line2: { type: String },
      city: { type: String },
      state: { type: String },
      postal_code: { type: String },
      country: { type: String, default: 'PH' }
    }
  },
  
  // Delivery information
  delivery_address: {
    line1: { type: String },
    line2: { type: String },
    city: { type: String },
    state: { type: String },
    postal_code: { type: String },
    country: { type: String, default: 'PH' }
  },
  
  // Metadata and tracking
  metadata: { type: Schema.Types.Mixed },
  webhook_events: [{
    event_type: { type: String, required: true },
    event_data: { type: Schema.Types.Mixed },
    received_at: { type: Date, default: Date.now }
  }],
  
  // Timestamps
  expires_at: { type: Date, index: { expireAfterSeconds: 0 } } // TTL index
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
})

// Indexes for better performance
PaymentSchema.index({ buyer_id: 1, created_at: -1 })
PaymentSchema.index({ seller_id: 1, created_at: -1 })
PaymentSchema.index({ status: 1, created_at: -1 })
PaymentSchema.index({ payment_method: 1, status: 1 })
PaymentSchema.index({ paymongo_payment_intent_id: 1 }, { unique: true, sparse: true })
PaymentSchema.index({ paymongo_source_id: 1 }, { unique: true, sparse: true })

// Virtual for amount in pesos
PaymentSchema.virtual('amount_in_pesos').get(function() {
  return this.amount / 100
})

// Methods
PaymentSchema.methods.markAsPaid = function(paymentId?: string) {
  this.status = 'paid'
  this.paid_at = new Date()
  if (paymentId) {
    this.paymongo_payment_id = paymentId
  }
  return this.save()
}

PaymentSchema.methods.markAsFailed = function(reason?: string) {
  this.status = 'failed'
  this.failed_at = new Date()
  if (reason) {
    this.failure_reason = reason
  }
  return this.save()
}

PaymentSchema.methods.markAsCancelled = function() {
  this.status = 'cancelled'
  this.cancelled_at = new Date()
  return this.save()
}

PaymentSchema.methods.addWebhookEvent = function(eventType: string, eventData: any) {
  this.webhook_events.push({
    event_type: eventType,
    event_data: eventData,
    received_at: new Date()
  })
  return this.save()
}

export const Payment = mongoose.models.Payment || mongoose.model<IPayment>('Payment', PaymentSchema)
