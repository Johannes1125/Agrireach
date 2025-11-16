import { NextRequest } from "next/server";
import { jsonError, jsonOk } from "@/server/utils/api";
import { connectToDatabase } from "@/server/lib/mongodb";
import { Order } from "@/server/models/Product";
import { Notification } from "@/server/models/Notification";
import { verifyWebhookSignature, LALAMOVE_CONFIG } from "@/lib/lalamove";

/**
 * GET handler for webhook verification
 * Lalamove tests the endpoint with GET to verify it's reachable
 * Must return 200 OK for webhook setup to succeed
 */
export async function GET(req: NextRequest) {
  return jsonOk({
    message: "Lalamove webhook endpoint is active",
    endpoint: "/api/delivery/lalamove/webhook",
    methods: ["GET", "POST"],
    status: "ready",
  });
}

export async function POST(req: NextRequest) {
  // Lalamove integration has been removed - using custom delivery system instead
  console.log('Lalamove webhook received but integration is disabled - using custom delivery system');
  return jsonOk({ 
    received: true, 
    message: 'Lalamove integration disabled - using custom delivery system' 
  });
  
  /* DISABLED - Lalamove integration removed
  try {
    // IMPORTANT: Return 200 OK immediately for initial connection
    // Lalamove may send empty body for initial connection test
    const body = await req.text();
    
    // If body is empty, just return 200 OK (initial connection test)
    if (!body || body.trim() === '') {
      console.log('Lalamove webhook initial connection test');
      return jsonOk({ received: true, message: 'Webhook endpoint is ready' });
    }

    // Parse the webhook payload
    let payload;
    try {
      payload = JSON.parse(body);
    } catch (parseError) {
      console.error('Failed to parse webhook body:', parseError);
      console.error('Raw body:', body);
      // Still return 200 OK to prevent webhook from being disabled
      return jsonOk({ received: true, message: 'Body parse error but endpoint is active' });
    }

    // Log full payload for debugging
    console.log('Received Lalamove webhook payload:', JSON.stringify(payload, null, 2));

    // Verify webhook signature
    // Lalamove sends: apiKey, timestamp, signature in the payload
    const { apiKey, timestamp, signature } = payload;
    
    if (LALAMOVE_CONFIG.secret && timestamp && signature) {
      // Verify signature using the payload timestamp and signature
      if (!verifyWebhookSignature(body, signature, String(timestamp))) {
        console.error('Invalid Lalamove webhook signature');
        return jsonError('Invalid signature', 401);
      }
      console.log('Lalamove webhook signature verified');
    } else {
      console.warn('Lalamove webhook signature verification skipped (missing fields)');
    }

    await connectToDatabase();

    // Extract event information - handle different payload structures
    const eventType = payload.eventType || payload.messageType || payload.type;
    const eventId = payload.eventId || payload.id;
    const eventVersion = payload.eventVersion || payload.version;
    const eventData = payload.data || payload;

    if (!eventType) {
      console.error('Lalamove webhook missing eventType. Full payload:', JSON.stringify(payload, null, 2));
      // Return 200 OK anyway to prevent webhook from being disabled
      // But log the issue for debugging
      return jsonOk({ 
        received: true, 
        warning: 'Missing eventType',
        payload_keys: Object.keys(payload)
      });
    }

    // Handle different webhook event types
    // Note: Webhooks may not arrive in chronological order - sort by timestamp if needed
    switch (eventType) {
      case 'ORDER_STATUS_CHANGED':
        await handleOrderStatusChanged(eventData, eventId, String(timestamp));
        break;
      
      case 'DRIVER_ASSIGNED':
        await handleDriverAssigned(eventData, eventId, String(timestamp));
        break;
      
      case 'ORDER_AMOUNT_CHANGED':
        await handleOrderAmountChanged(eventData, eventId, String(timestamp));
        break;
      
      case 'ORDER_REPLACED':
        await handleOrderReplaced(eventData, eventId, String(timestamp));
        break;
      
      case 'ORDER_EDITED':
        await handleOrderEdited(eventData, eventId, String(timestamp));
        break;
      
      case 'WALLET_BALANCE_CHANGED':
        // Handle wallet balance changes if needed
        console.log('Wallet balance changed:', eventData);
        break;
      
      default:
        console.log(`Unhandled Lalamove webhook event type: ${eventType}`, { eventId, eventVersion });
    }

    return jsonOk({ received: true });
  } catch (error: any) {
    console.error('Lalamove webhook processing error:', error);
    // Still return 200 OK to prevent webhook from being disabled
    // Lalamove will retry if there's an issue, but we don't want to disable the webhook
    return jsonOk({ received: true, error: error.message });
  }
  */
}

/* DISABLED - Lalamove integration removed
async function handleOrderStatusChanged(eventData: any, eventId: string, timestamp: string) {
  // Extract order information from webhook payload
  const orderInfo = eventData.order || eventData;
  const orderId = orderInfo.orderId;
  const newStatus = orderInfo.status;
  const previousStatus = orderInfo.previousStatus;
  const driverId = orderInfo.driverId || '';
  const shareLink = orderInfo.shareLink || '';
  
  if (!orderId) {
    console.error('Lalamove webhook missing orderId in ORDER_STATUS_CHANGED');
    return;
  }

  // Find order by Lalamove order ID
  const order = await Order.findOne({ lalamove_order_id: orderId })
    .populate('buyer_id', 'full_name')
    .populate('seller_id', 'full_name');

  if (!order) {
    console.error(`Order not found for Lalamove order ID: ${orderId}`);
    return;
  }

  // Update order with new status
  order.lalamove_status = newStatus;

  // Update driver ID and tracking URL if provided
  if (driverId) {
    order.lalamove_driver_id = driverId;
  }
  if (shareLink) {
    order.lalamove_tracking_url = shareLink;
  }

  // Map Lalamove status to order status
  let orderStatus = order.status;
  if (newStatus === "ASSIGNING_DRIVER" || newStatus === "ON_GOING") {
    orderStatus = "shipped";
  } else if (newStatus === "PICKED_UP") {
    orderStatus = "shipped";
  } else if (newStatus === "COMPLETED") {
    orderStatus = "delivered";
  } else if (newStatus === "CANCELED" || newStatus === "CANCELLED") {
    orderStatus = "cancelled";
  }

  order.status = orderStatus;
  await order.save();

  // Send notification
  const statusMessages: Record<string, string> = {
    "ASSIGNING_DRIVER": "Driver is being assigned to your delivery",
    "ON_GOING": "Your order is on the way",
    "PICKED_UP": "Your order has been picked up",
    "COMPLETED": "Your order has been delivered",
    "CANCELED": "Your delivery has been cancelled",
    "CANCELLED": "Your delivery has been cancelled",
  };

  // Include cancel reason if available
  let message = statusMessages[newStatus] || `Delivery status: ${newStatus}`;
  if ((newStatus === "CANCELED" || newStatus === "CANCELLED") && orderInfo.cancelReason) {
    message += ` - ${orderInfo.cancelReason}`;
  }

  await Notification.create({
    user_id: order.buyer_id._id,
    type: 'order_update',
    title: 'Delivery Status Updated',
    message: message,
    priority: newStatus === "COMPLETED" ? 'high' : 'medium',
    action_url: `/marketplace/orders/${order._id}`,
  });

  console.log(`Order ${order._id} status updated to ${orderStatus} (Lalamove: ${newStatus}, Event: ${eventId})`);
}

async function handleDriverAssigned(eventData: any, eventId: string, timestamp: string) {
  const orderInfo = eventData.order || eventData;
  const orderId = orderInfo.orderId;
  const driverId = orderInfo.driverId;
  
  if (!orderId) {
    console.error('Lalamove webhook missing orderId in DRIVER_ASSIGNED');
    return;
  }

  const order = await Order.findOne({ lalamove_order_id: orderId })
    .populate('buyer_id', 'full_name')
    .populate('seller_id', 'full_name');

  if (!order) {
    console.error(`Order not found for Lalamove order ID: ${orderId}`);
    return;
  }

  order.lalamove_driver_id = driverId;
  order.status = "shipped";
  await order.save();

  await Notification.create({
    user_id: order.buyer_id._id,
    type: 'order_update',
    title: 'Driver Assigned',
    message: 'A driver has been assigned to your delivery. Your order is on the way!',
    priority: 'high',
    action_url: `/marketplace/orders/${order._id}`,
  });

  console.log(`Driver ${driverId} assigned to order ${order._id}`);
}

async function handleOrderAmountChanged(eventData: any, eventId: string, timestamp: string) {
  const orderInfo = eventData.order || eventData;
  const orderId = orderInfo.orderId;
  
  if (!orderId) {
    console.error('Lalamove webhook missing orderId in ORDER_AMOUNT_CHANGED');
    return;
  }

  const order = await Order.findOne({ lalamove_order_id: orderId })
    .populate('seller_id', 'full_name');

  if (!order) {
    console.error(`Order not found for Lalamove order ID: ${orderId}`);
    return;
  }

  // Log amount change but don't update order price
  console.log(`Order ${order._id} amount changed:`, eventData);
  
  await Notification.create({
    user_id: order.seller_id._id,
    type: 'order_update',
    title: 'Delivery Amount Changed',
    message: `The delivery amount for order has changed. New amount: ${eventData.amount || 'N/A'}`,
    priority: 'low',
    action_url: `/marketplace/orders/${order._id}`,
  });
}

async function handleOrderReplaced(eventData: any, eventId: string, timestamp: string) {
  // ORDER_REPLACED: prevOrderId is the old order, order.orderId is the new order
  const prevOrderId = eventData.prevOrderId;
  const newOrderId = eventData.order?.orderId;
  
  if (!prevOrderId || !newOrderId) {
    console.error('Lalamove webhook missing order IDs in ORDER_REPLACED');
    return;
  }

  // Find order by old Lalamove order ID
  const order = await Order.findOne({ lalamove_order_id: prevOrderId })
    .populate('buyer_id', 'full_name')
    .populate('seller_id', 'full_name');

  if (!order) {
    console.error(`Order not found for Lalamove order ID: ${prevOrderId}`);
    return;
  }

  // Update with new order ID
  order.lalamove_order_id = newOrderId;
  await order.save();

  await Notification.create({
    user_id: order.buyer_id._id,
    type: 'order_update',
    title: 'Delivery Order Replaced',
    message: 'Your delivery order has been replaced with a new order ID.',
    priority: 'medium',
    action_url: `/marketplace/orders/${order._id}`,
  });

  console.log(`Order ${order._id} replaced with new Lalamove order: ${newOrderId}`);
}

async function handleOrderEdited(eventData: any, eventId: string, timestamp: string) {
  const orderInfo = eventData.order || eventData;
  const orderId = orderInfo.orderId;
  
  if (!orderId) {
    console.error('Lalamove webhook missing orderId in ORDER_EDITED');
    return;
  }

  const order = await Order.findOne({ lalamove_order_id: orderId })
    .populate('buyer_id', 'full_name')
    .populate('seller_id', 'full_name');

  if (!order) {
    console.error(`Order not found for Lalamove order ID: ${orderId}`);
    return;
  }

  // Update order with edited information
  // Only edited fields are included in the webhook
  if (orderInfo.shareLink) {
    order.lalamove_tracking_url = orderInfo.shareLink;
  }
  if (orderInfo.driverId) {
    order.lalamove_driver_id = orderInfo.driverId;
  }
  if (orderInfo.status) {
    order.lalamove_status = orderInfo.status;
  }
  // Handle stops if edited (delivery address changes)
  if (orderInfo.stops) {
    console.log('Order stops edited:', orderInfo.stops);
    // You can update delivery address here if needed
  }
  
  await order.save();

  await Notification.create({
    user_id: order.buyer_id._id,
    type: 'order_update',
    title: 'Delivery Updated',
    message: 'Your delivery information has been updated.',
    priority: 'low',
    action_url: `/marketplace/orders/${order._id}`,
  });

  console.log(`Order ${order._id} delivery information updated`);
}
*/

