import { NextRequest } from "next/server";
import { jsonError, jsonOk } from "@/server/utils/api";
import { connectToDatabase } from "@/server/lib/mongodb";
import { Order } from "@/server/models/Product";
import { Notification } from "@/server/models/Notification";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log('Received Lalamove webhook:', body);

    await connectToDatabase();

    const { messageType, orderId, data } = body;

    if (!orderId) {
      console.error('Lalamove webhook missing orderId');
      return jsonError('Missing orderId', 400);
    }

    // Find order by Lalamove order ID
    const order = await Order.findOne({ lalamove_order_id: orderId })
      .populate('buyer_id', 'full_name')
      .populate('seller_id', 'full_name');

    if (!order) {
      console.error(`Order not found for Lalamove order ID: ${orderId}`);
      return jsonError('Order not found', 404);
    }

    // Handle different webhook message types
    switch (messageType) {
      case 'ORDER_STATUS_CHANGED':
        await handleOrderStatusChanged(order, data);
        break;
      
      case 'DRIVER_ASSIGNED':
        await handleDriverAssigned(order, data);
        break;
      
      case 'ORDER_AMOUNT_CHANGED':
        await handleOrderAmountChanged(order, data);
        break;
      
      case 'ORDER_REPLACED':
        await handleOrderReplaced(order, data);
        break;
      
      case 'ORDER_EDITED':
        await handleOrderEdited(order, data);
        break;
      
      default:
        console.log(`Unhandled Lalamove webhook type: ${messageType}`);
    }

    return jsonOk({ received: true });
  } catch (error: any) {
    console.error('Lalamove webhook processing error:', error);
    return jsonError('Webhook processing failed', 500);
  }
}

async function handleOrderStatusChanged(order: any, data: any) {
  const newStatus = data.status;
  order.lalamove_status = newStatus;

  // Map Lalamove status to order status
  let orderStatus = order.status;
  if (newStatus === "ASSIGNING_DRIVER" || newStatus === "ON_GOING") {
    orderStatus = "shipped";
  } else if (newStatus === "PICKED_UP") {
    orderStatus = "shipped";
  } else if (newStatus === "COMPLETED") {
    orderStatus = "delivered";
  } else if (newStatus === "CANCELLED") {
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
    "CANCELLED": "Your delivery has been cancelled",
  };

  await Notification.create({
    user_id: order.buyer_id._id,
    type: 'order_update',
    title: 'Delivery Status Updated',
    message: statusMessages[newStatus] || `Delivery status: ${newStatus}`,
    priority: newStatus === "COMPLETED" ? 'high' : 'medium',
    action_url: `/marketplace/orders/${order._id}`,
  });

  console.log(`Order ${order._id} status updated to ${orderStatus} (Lalamove: ${newStatus})`);
}

async function handleDriverAssigned(order: any, data: any) {
  order.lalamove_driver_id = data.driverId;
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

  console.log(`Driver ${data.driverId} assigned to order ${order._id}`);
}

async function handleOrderAmountChanged(order: any, data: any) {
  // Log amount change but don't update order price
  console.log(`Order ${order._id} amount changed:`, data);
  
  await Notification.create({
    user_id: order.seller_id._id,
    type: 'order_update',
    title: 'Delivery Amount Changed',
    message: `The delivery amount for order has changed. New amount: ${data.amount || 'N/A'}`,
    priority: 'low',
    action_url: `/marketplace/orders/${order._id}`,
  });
}

async function handleOrderReplaced(order: any, data: any) {
  // Update with new order ID
  if (data.newOrderId) {
    order.lalamove_order_id = data.newOrderId;
    await order.save();
  }

  await Notification.create({
    user_id: order.buyer_id._id,
    type: 'order_update',
    title: 'Delivery Order Replaced',
    message: 'Your delivery order has been replaced with a new order ID.',
    priority: 'medium',
    action_url: `/marketplace/orders/${order._id}`,
  });

  console.log(`Order ${order._id} replaced with new Lalamove order: ${data.newOrderId}`);
}

async function handleOrderEdited(order: any, data: any) {
  // Update order with edited information
  if (data.shareLink) {
    order.lalamove_tracking_url = data.shareLink;
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

