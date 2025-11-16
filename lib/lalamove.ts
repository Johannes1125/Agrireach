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
    remarks?: string; // optional
  };
  recipients: Array<{
    stopId: string;
    name: string;
    phone: string;
    remarks?: string; // optional
  }>;
  isPODEnabled?: boolean; // optional - enable Proof of Delivery
  partner?: string; // optional
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
        market: LALAMOVE_MARKET, // Required for proper market routing
        serviceType: request.serviceType,
        specialRequests: request.specialRequests || [],
        language: request.language || 'en',
        stops: request.stops,
        item: request.item,
      },
    });

    // Log the request being sent
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📤 [Lalamove API] GET QUOTATION REQUEST');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('URL:', `${LALAMOVE_BASE_URL}${path}`);
    console.log('Method: POST');
    console.log('Request Body:', JSON.stringify(JSON.parse(body), null, 2));
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const response = await fetch(`${LALAMOVE_BASE_URL}${path}`, {
      method: 'POST',
      headers: getAuthHeaders('POST', path, body),
      body,
    });

    // Get response as text first so we can log it
    const responseText = await response.text();
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = responseText;
    }

    // Log the response received from Lalamove
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📥 [Lalamove API] GET QUOTATION RESPONSE');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Status:', response.status, response.statusText);
    console.log('Full Response from Lalamove:', JSON.stringify(responseData, null, 2));
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    if (!response.ok) {
      const errorMessage = responseData.errors?.[0]?.message || responseData.errors?.[0]?.detail || `HTTP ${response.status}`;
      throw new LalamoveError(errorMessage, responseData.errors?.[0]?.id, responseData);
    }

    return responseData;
  } catch (error: any) {
    console.error('❌ [Lalamove API] GET QUOTATION ERROR:', error);
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

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📤 [Lalamove API] GET QUOTATION DETAILS REQUEST');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('URL:', `${LALAMOVE_BASE_URL}${path}`);
    console.log('Method: GET');
    console.log('Quotation ID:', quotationId);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const response = await fetch(`${LALAMOVE_BASE_URL}${path}`, {
      method: 'GET',
      headers: getAuthHeaders('GET', path, body),
    });

    // Get response as text first so we can log it
    const responseText = await response.text();
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = responseText;
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📥 [Lalamove API] GET QUOTATION DETAILS RESPONSE');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Status:', response.status, response.statusText);
    console.log('Full Response from Lalamove:', JSON.stringify(responseData, null, 2));
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    if (!response.ok) {
      const errorMessage = responseData.errors?.[0]?.message || responseData.errors?.[0]?.detail || `HTTP ${response.status}`;
      throw new LalamoveError(errorMessage, responseData.errors?.[0]?.id, responseData);
    }

    return responseData;
  } catch (error: any) {
    console.error('❌ [Lalamove API] GET QUOTATION DETAILS ERROR:', error);
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
        isPODEnabled: request.isPODEnabled || false,
        partner: request.partner,
        metadata: request.metadata || {},
      },
    });

    // Log the request being sent
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📤 [Lalamove API] PLACE ORDER REQUEST');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('URL:', `${LALAMOVE_BASE_URL}${path}`);
    console.log('Method: POST');
    console.log('Request Body:', JSON.stringify(JSON.parse(body), null, 2));
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const response = await fetch(`${LALAMOVE_BASE_URL}${path}`, {
      method: 'POST',
      headers: getAuthHeaders('POST', path, body),
      body,
    });

    // Get response as text first so we can log it
    const responseText = await response.text();
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = responseText;
    }

    // Log the response received from Lalamove
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📥 [Lalamove API] PLACE ORDER RESPONSE');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Status:', response.status, response.statusText);
    console.log('Full Response from Lalamove:', JSON.stringify(responseData, null, 2));
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    if (!response.ok) {
      const errorMessage = responseData.errors?.[0]?.message || responseData.errors?.[0]?.detail || `HTTP ${response.status}`;
      throw new LalamoveError(errorMessage, responseData.errors?.[0]?.id, responseData);
    }

    return responseData;
  } catch (error: any) {
    console.error('❌ [Lalamove API] PLACE ORDER ERROR:', error);
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

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📤 [Lalamove API] GET ORDER DETAILS REQUEST');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('URL:', `${LALAMOVE_BASE_URL}${path}`);
    console.log('Method: GET');
    console.log('Order ID:', orderId);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const response = await fetch(`${LALAMOVE_BASE_URL}${path}`, {
      method: 'GET',
      headers: getAuthHeaders('GET', path, body),
    });

    // Get response as text first so we can log it
    const responseText = await response.text();
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = responseText;
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📥 [Lalamove API] GET ORDER DETAILS RESPONSE');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Status:', response.status, response.statusText);
    console.log('Full Response from Lalamove:', JSON.stringify(responseData, null, 2));
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    if (!response.ok) {
      const errorMessage = responseData.errors?.[0]?.message || responseData.errors?.[0]?.detail || `HTTP ${response.status}`;
      throw new LalamoveError(errorMessage, responseData.errors?.[0]?.id, responseData);
    }

    return responseData;
  } catch (error: any) {
    console.error('❌ [Lalamove API] GET ORDER DETAILS ERROR:', error);
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

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📤 [Lalamove API] CANCEL ORDER REQUEST');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('URL:', `${LALAMOVE_BASE_URL}${path}`);
    console.log('Method: PUT');
    console.log('Order ID:', orderId);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const response = await fetch(`${LALAMOVE_BASE_URL}${path}`, {
      method: 'PUT',
      headers: getAuthHeaders('PUT', path, body),
      body,
    });

    // Get response as text first so we can log it
    const responseText = await response.text();
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = responseText;
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📥 [Lalamove API] CANCEL ORDER RESPONSE');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Status:', response.status, response.statusText);
    console.log('Full Response from Lalamove:', JSON.stringify(responseData, null, 2));
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    if (!response.ok) {
      const errorMessage = responseData.errors?.[0]?.message || responseData.errors?.[0]?.detail || `HTTP ${response.status}`;
      throw new LalamoveError(errorMessage, responseData.errors?.[0]?.id, responseData);
    }

    return responseData;
  } catch (error: any) {
    console.error('❌ [Lalamove API] CANCEL ORDER ERROR:', error);
    if (error instanceof LalamoveError) {
      throw error;
    }
    throw new LalamoveError(error.message || 'Failed to cancel order');
  }
}

/**
 * Edit order
 * PATCH /v3/orders/{orderId}
 * Allows editing order details before pickup
 */
export interface LalamoveEditOrderRequest {
  stops?: Array<{
    stopId: string;
    coordinates?: {
      lat: string;
      lng: string;
    };
    address?: string;
  }>;
  recipients?: Array<{
    stopId: string;
    name?: string;
    phone?: string;
    remarks?: string;
  }>;
  sender?: {
    stopId: string;
    name?: string;
    phone?: string;
  };
  metadata?: Record<string, any>;
}

export async function editOrder(orderId: string, request: LalamoveEditOrderRequest) {
  try {
    if (!LALAMOVE_API_KEY || !LALAMOVE_SECRET) {
      throw new LalamoveError('Lalamove API credentials are not configured');
    }

    const path = `/orders/${orderId}`;
    const body = JSON.stringify({
      data: {
        stops: request.stops,
        recipients: request.recipients,
        sender: request.sender,
        metadata: request.metadata,
      },
    });

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📤 [Lalamove API] EDIT ORDER REQUEST');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('URL:', `${LALAMOVE_BASE_URL}${path}`);
    console.log('Method: PATCH');
    console.log('Order ID:', orderId);
    console.log('Request Body:', JSON.stringify(JSON.parse(body), null, 2));
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const response = await fetch(`${LALAMOVE_BASE_URL}${path}`, {
      method: 'PATCH',
      headers: getAuthHeaders('PATCH', path, body),
      body,
    });

    // Get response as text first so we can log it
    const responseText = await response.text();
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = responseText;
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📥 [Lalamove API] EDIT ORDER RESPONSE');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Status:', response.status, response.statusText);
    console.log('Full Response from Lalamove:', JSON.stringify(responseData, null, 2));
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    if (!response.ok) {
      const errorMessage = responseData.errors?.[0]?.message || responseData.errors?.[0]?.detail || `HTTP ${response.status}`;
      throw new LalamoveError(errorMessage, responseData.errors?.[0]?.id, responseData);
    }

    return responseData;
  } catch (error: any) {
    console.error('❌ [Lalamove API] EDIT ORDER ERROR:', error);
    if (error instanceof LalamoveError) {
      throw error;
    }
    throw new LalamoveError(error.message || 'Failed to edit order');
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

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📤 [Lalamove API] GET DRIVER DETAILS REQUEST');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('URL:', `${LALAMOVE_BASE_URL}${path}`);
    console.log('Method: GET');
    console.log('Order ID:', orderId);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const response = await fetch(`${LALAMOVE_BASE_URL}${path}`, {
      method: 'GET',
      headers: getAuthHeaders('GET', path, body),
    });

    // Get response as text first so we can log it
    const responseText = await response.text();
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = responseText;
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📥 [Lalamove API] GET DRIVER DETAILS RESPONSE');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Status:', response.status, response.statusText);
    console.log('Full Response from Lalamove:', JSON.stringify(responseData, null, 2));
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    if (!response.ok) {
      const errorMessage = responseData.errors?.[0]?.message || responseData.errors?.[0]?.detail || `HTTP ${response.status}`;
      throw new LalamoveError(errorMessage, responseData.errors?.[0]?.id, responseData);
    }

    return responseData;
  } catch (error: any) {
    console.error('❌ [Lalamove API] GET DRIVER DETAILS ERROR:', error);
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

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📤 [Lalamove API] GET CITY INFO REQUEST');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('URL:', `${LALAMOVE_BASE_URL}${path}`);
    console.log('Method: GET');
    console.log('City:', city);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const response = await fetch(`${LALAMOVE_BASE_URL}${path}`, {
      method: 'GET',
      headers: getAuthHeaders('GET', path, body),
    });

    // Get response as text first so we can log it
    const responseText = await response.text();
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = responseText;
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📥 [Lalamove API] GET CITY INFO RESPONSE');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Status:', response.status, response.statusText);
    console.log('Full Response from Lalamove:', JSON.stringify(responseData, null, 2));
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    if (!response.ok) {
      const errorMessage = responseData.errors?.[0]?.message || responseData.errors?.[0]?.detail || `HTTP ${response.status}`;
      throw new LalamoveError(errorMessage, responseData.errors?.[0]?.id, responseData);
    }

    return responseData;
  } catch (error: any) {
    console.error('❌ [Lalamove API] GET CITY INFO ERROR:', error);
    if (error instanceof LalamoveError) {
      throw error;
    }
    throw new LalamoveError(error.message || 'Failed to get city info');
  }
}

/**
 * Set webhook URL via API
 * PATCH /v3/webhook
 */
export async function setWebhookUrl(webhookUrl: string) {
  try {
    if (!LALAMOVE_API_KEY || !LALAMOVE_SECRET) {
      throw new LalamoveError('Lalamove API credentials are not configured');
    }

    const path = '/webhook';
    const body = JSON.stringify({
      data: {
        url: webhookUrl,
      },
    });

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📤 [Lalamove API] SET WEBHOOK URL REQUEST');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('URL:', `${LALAMOVE_BASE_URL}${path}`);
    console.log('Method: PATCH');
    console.log('Webhook URL:', webhookUrl);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const response = await fetch(`${LALAMOVE_BASE_URL}${path}`, {
      method: 'PATCH',
      headers: getAuthHeaders('PATCH', path, body),
      body,
    });

    // Get response as text first so we can log it
    const responseText = await response.text();
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = responseText;
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📥 [Lalamove API] SET WEBHOOK URL RESPONSE');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Status:', response.status, response.statusText);
    console.log('Full Response from Lalamove:', JSON.stringify(responseData, null, 2));
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    if (!response.ok) {
      const errorMessage = responseData.errors?.[0]?.message || responseData.errors?.[0]?.detail || `HTTP ${response.status}`;
      throw new LalamoveError(errorMessage, responseData.errors?.[0]?.id, responseData);
    }

    return responseData;
  } catch (error: any) {
    console.error('❌ [Lalamove API] SET WEBHOOK URL ERROR:', error);
    if (error instanceof LalamoveError) {
      throw error;
    }
    throw new LalamoveError(error.message || 'Failed to set webhook URL');
  }
}

/**
 * Verify Lalamove webhook signature
 * Lalamove uses HMAC SHA256 signature similar to their API authentication
 */
export function verifyWebhookSignature(
  body: string,
  signature: string,
  timestamp: string
): boolean {
  if (!LALAMOVE_SECRET) {
    console.error('Lalamove secret is not configured');
    return false;
  }

  try {
    const crypto = require('crypto');
    // Lalamove webhook signature format: timestamp + body
    const rawSignature = `${timestamp}\r\n${body}`;
    const expectedSignature = crypto
      .createHmac('sha256', LALAMOVE_SECRET)
      .update(rawSignature)
      .digest('hex');

    // Compare signatures using constant-time comparison to prevent timing attacks
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch (error) {
    console.error('Error verifying webhook signature:', error);
    return false;
  }
}

export const LALAMOVE_CONFIG = {
  apiKey: LALAMOVE_API_KEY,
  secret: LALAMOVE_SECRET,
  baseUrl: LALAMOVE_BASE_URL,
  market: LALAMOVE_MARKET,
};

export { LalamoveError };

