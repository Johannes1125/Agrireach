/**
 * Enhanced PayMongo Integration for Next.js
 * Documentation: https://developers.paymongo.com/
 */

const PAYMONGO_SECRET_KEY = process.env.PAYMONGO_SECRET_KEY || '';
const PAYMONGO_PUBLIC_KEY = process.env.PAYMONGO_PUBLIC_KEY || '';
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

// Base64 encode the secret key for API authentication
const getAuthHeader = () => {
  if (!PAYMONGO_SECRET_KEY) {
    throw new Error('PayMongo secret key is not configured');
  }
  const encoded = Buffer.from(`${PAYMONGO_SECRET_KEY}:`).toString('base64');
  return `Basic ${encoded}`;
};

// Enhanced error handling
class PayMongoError extends Error {
  constructor(
    message: string,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'PayMongoError';
  }
}

// API response wrapper
const handleApiResponse = async (response: Response) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    const errorMessage = error.errors?.[0]?.detail || error.message || `HTTP ${response.status}`;
    throw new PayMongoError(errorMessage, error.errors?.[0]?.code, error);
  }
  return response.json();
};

export interface PaymentIntentData {
  amount: number; // Amount in centavos (e.g., 10000 = ₱100.00)
  currency: string; // 'PHP'
  description: string;
  statement_descriptor?: string;
  metadata?: Record<string, any>;
  payment_method_allowed?: string[];
}

export interface PaymentMethodData {
  type: 'card' | 'gcash' | 'paymaya' | 'grab_pay';
  details?: {
    card_number?: string;
    exp_month?: number;
    exp_year?: number;
    cvc?: string;
  };
  billing?: {
    name: string;
    email: string;
    phone?: string;
    address?: {
      line1: string;
      line2?: string;
      city: string;
      state: string;
      postal_code: string;
      country: string;
    };
  };
}

export interface SourceData {
  type: 'gcash' | 'grab_pay';
  amount: number;
  currency: string;
  redirect: {
    success: string;
    failed: string;
  };
  billing?: {
    name: string;
    email: string;
    phone: string;
  };
}

/**
 * Create a Payment Intent
 * A PaymentIntent represents an intent to collect payment from a customer
 */
export async function createPaymentIntent(data: PaymentIntentData) {
  try {
    const response = await fetch('https://api.paymongo.com/v1/payment_intents', {
      method: 'POST',
      headers: {
        'Authorization': getAuthHeader(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: {
          attributes: {
            amount: data.amount,
            currency: data.currency,
            description: data.description,
            statement_descriptor: data.statement_descriptor || 'AgriReach Purchase',
            payment_method_allowed: data.payment_method_allowed || ['card', 'gcash', 'paymaya', 'grab_pay'],
            metadata: data.metadata || {},
          },
        },
      }),
    });

    const result = await handleApiResponse(response);
    return result.data;
  } catch (error: any) {
    console.error('PayMongo createPaymentIntent error:', error);
    throw error;
  }
}

/**
 * Create a Payment Method
 * A PaymentMethod represents the payment instrument (card, e-wallet, etc.)
 */
export async function createPaymentMethod(data: PaymentMethodData) {
  try {
    const response = await fetch('https://api.paymongo.com/v1/payment_methods', {
      method: 'POST',
      headers: {
        'Authorization': getAuthHeader(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: {
          attributes: {
            type: data.type,
            details: data.details,
            billing: data.billing,
          },
        },
      }),
    });

    const result = await handleApiResponse(response);
    return result.data;
  } catch (error: any) {
    console.error('PayMongo createPaymentMethod error:', error);
    throw error;
  }
}

/**
 * Attach Payment Method to Payment Intent
 */
export async function attachPaymentIntent(
  paymentIntentId: string, 
  paymentMethodId: string, 
  returnUrl?: string
) {
  try {
    const response = await fetch(`https://api.paymongo.com/v1/payment_intents/${paymentIntentId}/attach`, {
      method: 'POST',
      headers: {
        'Authorization': getAuthHeader(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: {
          attributes: {
            payment_method: paymentMethodId,
            return_url: returnUrl || `${BASE_URL}/marketplace/payment/success`,
          },
        },
      }),
    });

    const result = await handleApiResponse(response);
    return result.data;
  } catch (error: any) {
    console.error('PayMongo attachPaymentIntent error:', error);
    throw error;
  }
}

/**
 * Retrieve Payment Intent
 */
export async function retrievePaymentIntent(paymentIntentId: string) {
  try {
    const response = await fetch(`https://api.paymongo.com/v1/payment_intents/${paymentIntentId}`, {
      method: 'GET',
      headers: {
        'Authorization': getAuthHeader(),
      },
    });

    const result = await handleApiResponse(response);
    return result.data;
  } catch (error: any) {
    console.error('PayMongo retrievePaymentIntent error:', error);
    throw error;
  }
}

/**
 * Create a Source (for e-wallet payments like GCash, GrabPay, etc.)
 */
export async function createSource(data: SourceData) {
  try {
    const response = await fetch('https://api.paymongo.com/v1/sources', {
      method: 'POST',
      headers: {
        'Authorization': getAuthHeader(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: {
          attributes: data,
        },
      }),
    });

    const result = await handleApiResponse(response);
    return result.data;
  } catch (error: any) {
    console.error('PayMongo createSource error:', error);
    throw error;
  }
}

/**
 * Retrieve a Source
 */
export async function retrieveSource(sourceId: string) {
  try {
    const response = await fetch(`https://api.paymongo.com/v1/sources/${sourceId}`, {
      method: 'GET',
      headers: {
        'Authorization': getAuthHeader(),
      },
    });

    const result = await handleApiResponse(response);
    return result.data;
  } catch (error: any) {
    console.error('PayMongo retrieveSource error:', error);
    throw error;
  }
}

/**
 * Create a Payment (for completed sources)
 */
export async function createPayment(paymentIntentId: string, sourceId: string) {
  try {
    const response = await fetch('https://api.paymongo.com/v1/payments', {
      method: 'POST',
      headers: {
        'Authorization': getAuthHeader(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: {
          attributes: {
            amount: 0, // Will be taken from payment intent
            currency: 'PHP',
            description: 'AgriReach Payment',
            statement_descriptor: 'AgriReach',
            source: {
              id: sourceId,
              type: 'source'
            },
            payment_intent: {
              id: paymentIntentId
            }
          },
        },
      }),
    });

    const result = await handleApiResponse(response);
    return result.data;
  } catch (error: any) {
    console.error('PayMongo createPayment error:', error);
    throw error;
  }
}

/**
 * Retrieve a Payment
 */
export async function retrievePayment(paymentId: string) {
  try {
    const response = await fetch(`https://api.paymongo.com/v1/payments/${paymentId}`, {
      method: 'GET',
      headers: {
        'Authorization': getAuthHeader(),
      },
    });

    const result = await handleApiResponse(response);
    return result.data;
  } catch (error: any) {
    console.error('PayMongo retrievePayment error:', error);
    throw error;
  }
}

/**
 * Create a Refund
 */
export async function createRefund(paymentId: string, amount?: number, reason?: string) {
  try {
    const response = await fetch('https://api.paymongo.com/v1/refunds', {
      method: 'POST',
      headers: {
        'Authorization': getAuthHeader(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: {
          attributes: {
            amount: amount || 0, // 0 means full refund
            payment_id: paymentId,
            reason: reason || 'Refund requested',
            notes: 'AgriReach refund'
          },
        },
      }),
    });

    const result = await handleApiResponse(response);
    return result.data;
  } catch (error: any) {
    console.error('PayMongo createRefund error:', error);
    throw error;
  }
}

/**
 * Verify webhook signature
 */
export function verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
  try {
    const crypto = require('crypto');
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
    
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  } catch (error) {
    console.error('Webhook signature verification error:', error);
    return false;
  }
}

export const PAYMONGO_CONFIG = {
  publicKey: PAYMONGO_PUBLIC_KEY,
  secretKey: PAYMONGO_SECRET_KEY,
  apiUrl: 'https://api.paymongo.com/v1',
  webhookSecret: process.env.PAYMONGO_WEBHOOK_SECRET || '',
};

export { PayMongoError };
