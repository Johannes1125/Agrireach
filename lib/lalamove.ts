/**
 * Lalamove API Integration
 * Documentation: https://developers.lalamove.com/
 */

const LALAMOVE_API_KEY = process.env.LALAMOVE_API_KEY || '';
const LALAMOVE_SECRET = process.env.LALAMOVE_SECRET || '';
const LALAMOVE_BASE_URL = process.env.LALAMOVE_BASE_URL || 'https://rest.sandbox.lalamove.com/v3';
const LALAMOVE_MARKET = process.env.LALAMOVE_MARKET || 'PH_PH'; // Philippines

// Generate signature for Lalamove API
function generateSignature(method: string, path: string, body: string, timestamp: number): string {
  const crypto = require('crypto');
  const rawSignature = `${timestamp}\r\n${method}\r\n${path}\r\n\r\n${body}`;
  return crypto.createHmac('sha256', LALAMOVE_SECRET).update(rawSignature).digest('hex');
}

// Get authorization headers
function getAuthHeaders(method: string, path: string, body: string) {
  const timestamp = Date.now();
  const signature = generateSignature(method, path, body, timestamp);
  
  return {
    'X-LLM-Content-Type': 'application/json',
    'Authorization': `hmac ${LALAMOVE_API_KEY}:${timestamp}:${signature}`,
    'Content-Type': 'application/json',
  };
}

export interface LalamoveQuotationRequest {
  serviceType: string; // 'MOTORCYCLE', 'CAR', 'VAN', etc.
  specialRequests?: string[]; // ['LALABAG', 'HELP', etc.]
  language?: string; // 'en', 'tl'
  stops: Array<{
    coordinates: {
      lat: string;
      lng: string;
    };
    address: string;
  }>;
  item?: {
    quantity: string;
    weight: string;
    categories?: string[];
    handles?: {
      quantity: string;
    };
    sizes?: {
      length: string;
      width: string;
      height: string;
    };
  };
}

export interface LalamovePlaceOrderRequest {
  quotationId: string;
  sender?: {
    stopId: string;
    name: string;
    phone: string;
  };
  recipients: Array<{
    stopId: string;
    name: string;
    phone: string;
  }>;
  metadata?: Record<string, any>;
}

export interface LalamoveOrderResponse {
  data: {
    orderId: string;
    status: string;
    driverId?: string;
    shareLink?: string;
    stops?: Array<{
      stopId: string;
      coordinates: {
        lat: string;
        lng: string;
      };
      address: string;
      status: string;
    }>;
  };
}

// Enhanced error handling
class LalamoveError extends Error {
  constructor(
    message: string,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'LalamoveError';
  }
}

/**
 * Get delivery quotation
 */
export async function getQuotation(request: LalamoveQuotationRequest) {
  try {
    if (!LALAMOVE_API_KEY || !LALAMOVE_SECRET) {
      throw new LalamoveError('Lalamove API credentials are not configured');
    }

    const path = '/quotations';
    const body = JSON.stringify({
      data: {
        serviceType: request.serviceType,
        specialRequests: request.specialRequests || [],
        language: request.language || 'en',
        stops: request.stops,
        item: request.item,
      },
    });

    const response = await fetch(`${LALAMOVE_BASE_URL}${path}`, {
      method: 'POST',
      headers: getAuthHeaders('POST', path, body),
      body,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      const errorMessage = error.errors?.[0]?.message || error.errors?.[0]?.detail || `HTTP ${response.status}`;
      throw new LalamoveError(errorMessage, error.errors?.[0]?.id, error);
    }

    return await response.json();
  } catch (error: any) {
    console.error('Lalamove getQuotation error:', error);
    if (error instanceof LalamoveError) {
      throw error;
    }
    throw new LalamoveError(error.message || 'Failed to get quotation');
  }
}

/**
 * Get quotation details
 */
export async function getQuotationDetails(quotationId: string) {
  try {
    if (!LALAMOVE_API_KEY || !LALAMOVE_SECRET) {
      throw new LalamoveError('Lalamove API credentials are not configured');
    }

    const path = `/quotations/${quotationId}`;
    const body = '';

    const response = await fetch(`${LALAMOVE_BASE_URL}${path}`, {
      method: 'GET',
      headers: getAuthHeaders('GET', path, body),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      const errorMessage = error.errors?.[0]?.message || error.errors?.[0]?.detail || `HTTP ${response.status}`;
      throw new LalamoveError(errorMessage, error.errors?.[0]?.id, error);
    }

    return await response.json();
  } catch (error: any) {
    console.error('Lalamove getQuotationDetails error:', error);
    if (error instanceof LalamoveError) {
      throw error;
    }
    throw new LalamoveError(error.message || 'Failed to get quotation details');
  }
}

/**
 * Place order
 */
export async function placeOrder(request: LalamovePlaceOrderRequest) {
  try {
    if (!LALAMOVE_API_KEY || !LALAMOVE_SECRET) {
      throw new LalamoveError('Lalamove API credentials are not configured');
    }

    const path = '/orders';
    const body = JSON.stringify({
      data: {
        quotationId: request.quotationId,
        sender: request.sender,
        recipients: request.recipients,
        metadata: request.metadata || {},
      },
    });

    const response = await fetch(`${LALAMOVE_BASE_URL}${path}`, {
      method: 'POST',
      headers: getAuthHeaders('POST', path, body),
      body,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      const errorMessage = error.errors?.[0]?.message || error.errors?.[0]?.detail || `HTTP ${response.status}`;
      throw new LalamoveError(errorMessage, error.errors?.[0]?.id, error);
    }

    return await response.json();
  } catch (error: any) {
    console.error('Lalamove placeOrder error:', error);
    if (error instanceof LalamoveError) {
      throw error;
    }
    throw new LalamoveError(error.message || 'Failed to place order');
  }
}

/**
 * Get order details
 */
export async function getOrderDetails(orderId: string) {
  try {
    if (!LALAMOVE_API_KEY || !LALAMOVE_SECRET) {
      throw new LalamoveError('Lalamove API credentials are not configured');
    }

    const path = `/orders/${orderId}`;
    const body = '';

    const response = await fetch(`${LALAMOVE_BASE_URL}${path}`, {
      method: 'GET',
      headers: getAuthHeaders('GET', path, body),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      const errorMessage = error.errors?.[0]?.message || error.errors?.[0]?.detail || `HTTP ${response.status}`;
      throw new LalamoveError(errorMessage, error.errors?.[0]?.id, error);
    }

    return await response.json();
  } catch (error: any) {
    console.error('Lalamove getOrderDetails error:', error);
    if (error instanceof LalamoveError) {
      throw error;
    }
    throw new LalamoveError(error.message || 'Failed to get order details');
  }
}

/**
 * Cancel order
 */
export async function cancelOrder(orderId: string) {
  try {
    if (!LALAMOVE_API_KEY || !LALAMOVE_SECRET) {
      throw new LalamoveError('Lalamove API credentials are not configured');
    }

    const path = `/orders/${orderId}/cancel`;
    const body = JSON.stringify({ data: {} });

    const response = await fetch(`${LALAMOVE_BASE_URL}${path}`, {
      method: 'PUT',
      headers: getAuthHeaders('PUT', path, body),
      body,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      const errorMessage = error.errors?.[0]?.message || error.errors?.[0]?.detail || `HTTP ${response.status}`;
      throw new LalamoveError(errorMessage, error.errors?.[0]?.id, error);
    }

    return await response.json();
  } catch (error: any) {
    console.error('Lalamove cancelOrder error:', error);
    if (error instanceof LalamoveError) {
      throw error;
    }
    throw new LalamoveError(error.message || 'Failed to cancel order');
  }
}

/**
 * Get driver details
 */
export async function getDriverDetails(orderId: string) {
  try {
    if (!LALAMOVE_API_KEY || !LALAMOVE_SECRET) {
      throw new LalamoveError('Lalamove API credentials are not configured');
    }

    const path = `/orders/${orderId}/driver`;
    const body = '';

    const response = await fetch(`${LALAMOVE_BASE_URL}${path}`, {
      method: 'GET',
      headers: getAuthHeaders('GET', path, body),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      const errorMessage = error.errors?.[0]?.message || error.errors?.[0]?.detail || `HTTP ${response.status}`;
      throw new LalamoveError(errorMessage, error.errors?.[0]?.id, error);
    }

    return await response.json();
  } catch (error: any) {
    console.error('Lalamove getDriverDetails error:', error);
    if (error instanceof LalamoveError) {
      throw error;
    }
    throw new LalamoveError(error.message || 'Failed to get driver details');
  }
}

/**
 * Get city info (available service types, special requests, etc.)
 */
export async function getCityInfo(city: string) {
  try {
    if (!LALAMOVE_API_KEY || !LALAMOVE_SECRET) {
      throw new LalamoveError('Lalamove API credentials are not configured');
    }

    const path = `/cities/${city}`;
    const body = '';

    const response = await fetch(`${LALAMOVE_BASE_URL}${path}`, {
      method: 'GET',
      headers: getAuthHeaders('GET', path, body),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      const errorMessage = error.errors?.[0]?.message || error.errors?.[0]?.detail || `HTTP ${response.status}`;
      throw new LalamoveError(errorMessage, error.errors?.[0]?.id, error);
    }

    return await response.json();
  } catch (error: any) {
    console.error('Lalamove getCityInfo error:', error);
    if (error instanceof LalamoveError) {
      throw error;
    }
    throw new LalamoveError(error.message || 'Failed to get city info');
  }
}

export const LALAMOVE_CONFIG = {
  apiKey: LALAMOVE_API_KEY,
  secret: LALAMOVE_SECRET,
  baseUrl: LALAMOVE_BASE_URL,
  market: LALAMOVE_MARKET,
};

export { LalamoveError };

