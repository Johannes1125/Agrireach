import Stripe from 'stripe';

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || '';
const STRIPE_PUBLISHABLE_KEY = process.env.STRIPE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

if (!STRIPE_SECRET_KEY) {
  console.warn('Stripe secret key is not configured');
}

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2025-10-29.clover',
  typescript: true,
});

// Enhanced error handling
export class StripeError extends Error {
  constructor(
    message: string,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'StripeError';
  }
}

export interface PaymentIntentData {
  amount: number; 
  currency: string; 
  description: string;
  metadata?: Record<string, string>;
  customer?: string; 
  payment_method_types?: ('card' | 'external_gcash' | 'external_grabpay')[];
}

export async function createPaymentIntent(data: PaymentIntentData) {
  try {

    const paymentIntent = await stripe.paymentIntents.create({
      amount: data.amount, 
      currency: data.currency.toLowerCase(), 
      description: data.description,
      metadata: data.metadata || {},
      payment_method_types: data.payment_method_types || ['card'],
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: 'always',
      },
    });

    return paymentIntent;
  } catch (error: any) {
    console.error('Stripe createPaymentIntent error:', error);
    throw new StripeError(
      error.message || 'Failed to create payment intent',
      error.code,
      error
    );
  }
}

export async function retrievePaymentIntent(paymentIntentId: string) {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    return paymentIntent;
  } catch (error: any) {
    console.error('Stripe retrievePaymentIntent error:', error);
    throw new StripeError(
      error.message || 'Failed to retrieve payment intent',
      error.code,
      error
    );
  }
}

export async function confirmPaymentIntent(
  paymentIntentId: string,
  paymentMethodId: string
) {
  try {
    const paymentIntent = await stripe.paymentIntents.confirm(paymentIntentId, {
      payment_method: paymentMethodId,
      return_url: `${BASE_URL}/marketplace/payment/success`,
    });
    return paymentIntent;
  } catch (error: any) {
    console.error('Stripe confirmPaymentIntent error:', error);
    throw new StripeError(
      error.message || 'Failed to confirm payment intent',
      error.code,
      error
    );
  }
}

export async function createCheckoutSession(data: {
  amount: number; 
  currency: string;
  description: string;
  success_url: string;
  cancel_url: string;
  metadata?: Record<string, string>;
  customer_email?: string;
  payment_method_types?: Stripe.Checkout.SessionCreateParams.PaymentMethodType[];
}) {
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: (data.payment_method_types || ['card', 'external_gcash', 'external_grabpay']) as Stripe.Checkout.SessionCreateParams.PaymentMethodType[],
      line_items: [
        {
          price_data: {
            currency: data.currency.toLowerCase(),
            product_data: {
              name: data.description,
            },
            unit_amount: data.amount, 
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: data.success_url,
      cancel_url: data.cancel_url,
      metadata: data.metadata || {},
      customer_email: data.customer_email,
    });

    return session;
  } catch (error: any) {
    console.error('Stripe createCheckoutSession error:', error);
    throw new StripeError(
      error.message || 'Failed to create checkout session',
      error.code,
      error
    );
  }
}

export async function createRefund(
  paymentIntentId: string,
  amount?: number,
  reason?: string
) {
  try {
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount: amount, 
      reason: reason ? (reason as Stripe.RefundCreateParams.Reason) : undefined,
    });
    return refund;
  } catch (error: any) {
    console.error('Stripe createRefund error:', error);
    throw new StripeError(
      error.message || 'Failed to create refund',
      error.code,
      error
    );
  }
}

export function verifyWebhookSignature(
  payload: string | Buffer,
  signature: string,
  secret: string
): Stripe.Event {
  try {
    const event = stripe.webhooks.constructEvent(
      payload,
      signature,
      secret
    );
    return event;
  } catch (error: any) {
    console.error('Webhook signature verification error:', error);
    throw new StripeError('Invalid webhook signature', 'invalid_signature', error);
  }
}

export const STRIPE_CONFIG = {
  publishableKey: STRIPE_PUBLISHABLE_KEY,
  secretKey: STRIPE_SECRET_KEY,
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
};

export { stripe };

