import { NextRequest } from "next/server";
import { jsonError, jsonOk } from "@/server/utils/api";
import { connectToDatabase } from "@/server/lib/mongodb";
import { Payment } from "@/server/models/Payment";
import { Order } from "@/server/models/Product";
import { WebhookEventSchema, verifyWebhookSignature } from "@/lib/paymongo";
import { PAYMONGO_CONFIG } from "@/lib/paymongo";

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get('paymongo-signature') || '';
    
    // Verify webhook signature
    if (!verifyWebhookSignature(body, signature, PAYMONGO_CONFIG.webhookSecret)) {
      console.error('Invalid webhook signature');
      return jsonError('Invalid signature', 401);
    }

    const event = JSON.parse(body);
    const result = WebhookEventSchema.safeParse(event);

    if (!result.success) {
      console.error('Invalid webhook event format:', result.error);
      return jsonError('Invalid event format', 400);
    }

    const { type, data } = result.data;
    
    console.log(`Received PayMongo webhook: ${type}`, data);

    await connectToDatabase();

    // Handle different webhook events
    switch (type) {
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(data);
        break;
      
      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(data);
        break;
      
      case 'source.chargeable':
        await handleSourceChargeable(data);
        break;
      
      case 'payment.succeeded':
        await handlePaymentSucceeded(data);
        break;
      
      case 'payment.failed':
        await handlePaymentFailed(data);
        break;
      
      default:
        console.log(`Unhandled webhook event type: ${type}`);
    }

    return jsonOk({ received: true });
  } catch (error: any) {
    console.error('Webhook processing error:', error);
    return jsonError('Webhook processing failed', 500);
  }
}

async function handlePaymentIntentSucceeded(data: any) {
  const paymentIntentId = data.id;
  
  try {
    const payment = await Payment.findOne({ 
      paymongo_payment_intent_id: paymentIntentId 
    });

    if (!payment) {
      console.error(`Payment not found for intent: ${paymentIntentId}`);
      return;
    }

    if (payment.status === 'paid') {
      console.log(`Payment ${payment._id} already processed`);
      return;
    }

    // Create orders
    const orderItems = payment.metadata?.order_items || [];
    const createdOrders = [];

    for (const item of orderItems) {
      const order = await Order.create({
        buyer_id: payment.buyer_id,
        seller_id: item.seller_id,
        product_id: item.product_id,
        quantity: item.quantity,
        total_price: item.price * item.quantity,
        delivery_address: payment.delivery_address?.line1 || '',
        delivery_address_structured: payment.delivery_address,
        status: "pending",
        payment_status: "paid",
        payment_method: payment.payment_method,
        payment_id: payment._id,
        paymongo_payment_intent_id: paymentIntentId
      });
      
      createdOrders.push(order._id);
    }

    // Update payment
    payment.status = 'paid';
    payment.paid_at = new Date();
    payment.metadata = {
      ...payment.metadata,
      order_ids: createdOrders
    };
    await payment.addWebhookEvent('payment_intent.succeeded', data);
    await payment.save();

    console.log(`Payment ${payment._id} confirmed via webhook`);
  } catch (error) {
    console.error(`Error processing payment intent succeeded: ${error}`);
  }
}

async function handlePaymentIntentFailed(data: any) {
  const paymentIntentId = data.id;
  
  try {
    const payment = await Payment.findOne({ 
      paymongo_payment_intent_id: paymentIntentId 
    });

    if (!payment) {
      console.error(`Payment not found for intent: ${paymentIntentId}`);
      return;
    }

    payment.status = 'failed';
    payment.failed_at = new Date();
    payment.failure_reason = data.attributes.last_payment_error?.message || 'Payment failed';
    await payment.addWebhookEvent('payment_intent.payment_failed', data);
    await payment.save();

    console.log(`Payment ${payment._id} failed via webhook`);
  } catch (error) {
    console.error(`Error processing payment intent failed: ${error}`);
  }
}

async function handleSourceChargeable(data: any) {
  const sourceId = data.id;
  
  try {
    const payment = await Payment.findOne({ 
      paymongo_source_id: sourceId 
    });

    if (!payment) {
      console.error(`Payment not found for source: ${sourceId}`);
      return;
    }

    // Source is chargeable, but we need to create a payment
    // This is typically handled by the frontend redirect flow
    console.log(`Source ${sourceId} is chargeable for payment ${payment._id}`);
    
    await payment.addWebhookEvent('source.chargeable', data);
    await payment.save();
  } catch (error) {
    console.error(`Error processing source chargeable: ${error}`);
  }
}

async function handlePaymentSucceeded(data: any) {
  const paymentId = data.id;
  
  try {
    const payment = await Payment.findOne({ 
      paymongo_payment_id: paymentId 
    });

    if (!payment) {
      console.error(`Payment not found for PayMongo payment: ${paymentId}`);
      return;
    }

    if (payment.status === 'paid') {
      console.log(`Payment ${payment._id} already processed`);
      return;
    }

    // Create orders
    const orderItems = payment.metadata?.order_items || [];
    const createdOrders = [];

    for (const item of orderItems) {
      const order = await Order.create({
        buyer_id: payment.buyer_id,
        seller_id: item.seller_id,
        product_id: item.product_id,
        quantity: item.quantity,
        total_price: item.price * item.quantity,
        delivery_address: payment.delivery_address?.line1 || '',
        delivery_address_structured: payment.delivery_address,
        status: "pending",
        payment_status: "paid",
        payment_method: payment.payment_method,
        payment_id: payment._id,
        paymongo_payment_id: paymentId
      });
      
      createdOrders.push(order._id);
    }

    // Update payment
    payment.status = 'paid';
    payment.paid_at = new Date();
    payment.metadata = {
      ...payment.metadata,
      order_ids: createdOrders
    };
    await payment.addWebhookEvent('payment.succeeded', data);
    await payment.save();

    console.log(`Payment ${payment._id} confirmed via webhook`);
  } catch (error) {
    console.error(`Error processing payment succeeded: ${error}`);
  }
}

async function handlePaymentFailed(data: any) {
  const paymentId = data.id;
  
  try {
    const payment = await Payment.findOne({ 
      paymongo_payment_id: paymentId 
    });

    if (!payment) {
      console.error(`Payment not found for PayMongo payment: ${paymentId}`);
      return;
    }

    payment.status = 'failed';
    payment.failed_at = new Date();
    payment.failure_reason = data.attributes.failure_reason || 'Payment failed';
    await payment.addWebhookEvent('payment.failed', data);
    await payment.save();

    console.log(`Payment ${payment._id} failed via webhook`);
  } catch (error) {
    console.error(`Error processing payment failed: ${error}`);
  }
}
