/**
 * PayMongo Integration for Next.js
 * Documentation: https://developers.paymongo.com/
 */

const PAYMONGO_SECRET_KEY = process.env.PAYMONGO_SECRET_KEY || '';
const PAYMONGO_PUBLIC_KEY = process.env.PAYMONGO_PUBLIC_KEY || '';

// Base64 encode the secret key for API authentication
const getAuthHeader = () => {
  const encoded = Buffer.from(PAYMONGO_SECRET_KEY).toString('base64');
  return `Basic ${encoded}`;
};

export interface PaymentIntentData {
  amount: number; // Amount in centavos (e.g., 10000 = ₱100.00)
  currency: string; // 'PHP'
  description: string;
  statement_descriptor?: string;
  metadata?: Record<string, any>;
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
            payment_method_allowed: ['card', 'gcash', 'paymaya', 'grab_pay'],
            metadata: data.metadata || {},
          },
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.errors?.[0]?.detail || 'Failed to create payment intent');
    }

    const result = await response.json();
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

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.errors?.[0]?.detail || 'Failed to create payment method');
    }

    const result = await response.json();
    return result.data;
  } catch (error: any) {
    console.error('PayMongo createPaymentMethod error:', error);
    throw error;
  }
}

/**
 * Attach Payment Method to Payment Intent
 */
export async function attachPaymentIntent(paymentIntentId: string, paymentMethodId: string, clientKey: string) {
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
            client_key: clientKey,
            return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/marketplace/payment/success`,
          },
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.errors?.[0]?.detail || 'Failed to attach payment intent');
    }

    const result = await response.json();
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

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.errors?.[0]?.detail || 'Failed to retrieve payment intent');
    }

    const result = await response.json();
    return result.data;
  } catch (error: any) {
    console.error('PayMongo retrievePaymentIntent error:', error);
    throw error;
  }
}

/**
 * Create a Source (for e-wallet payments like GCash, GrabPay, etc.)
 */
export async function createSource(data: {
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
}) {
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

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.errors?.[0]?.detail || 'Failed to create source');
    }

    const result = await response.json();
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

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.errors?.[0]?.detail || 'Failed to retrieve source');
    }

    const result = await response.json();
    return result.data;
  } catch (error: any) {
    console.error('PayMongo retrieveSource error:', error);
    throw error;
  }
}

export const PAYMONGO_CONFIG = {
  publicKey: PAYMONGO_PUBLIC_KEY,
  secretKey: PAYMONGO_SECRET_KEY,
  apiUrl: 'https://api.paymongo.com/v1',
};

