import { NextRequest } from "next/server";
import { jsonError, jsonOk } from "@/server/utils/api";
import { connectToDatabase } from "@/server/lib/mongodb";
import { Payment } from "@/server/models/Payment";
import { Order, Product, CartItem } from "@/server/models/Product";
import { verifyWebhookSignature, PAYMONGO_CONFIG } from "@/lib/paymongo";
import { autoSetupLalamoveDelivery } from "@/server/utils/lalamove-auto-setup";

export async function POST(req: NextRequest) {
  try {
    // Get raw body as text (important for signature verification)
    const body = await req.text();
    
    // PayMongo sends signature in 'paymongo-signature' header
    const signature = req.headers.get('paymongo-signature') || '';
    
    if (!PAYMONGO_CONFIG.webhookSecret) {
      console.error('PayMongo webhook secret is not configured');
      return jsonError('Webhook secret not configured', 500);
    }

    // Verify webhook signature
    if (!verifyWebhookSignature(body, signature, PAYMONGO_CONFIG.webhookSecret)) {
      console.error('Invalid webhook signature');
      return jsonError('Invalid signature', 401);
    }

    // Parse the event
    const event = JSON.parse(body);
    console.log(`Received PayMongo webhook: ${event.type}`, event.id);

    await connectToDatabase();

    // Handle different webhook events based on what you selected
    switch (event.type) {
      case 'payment.paid':
        await handlePaymentPaid(event.data);
        break;
      
      case 'payment.failed':
        await handlePaymentFailed(event.data);
        break;
      
      case 'source.chargeable':
        await handleSourceChargeable(event.data);
        break;
      
      case 'checkout_session.payment.paid':
        await handleCheckoutSessionPaymentPaid(event.data);
        break;
      
      case 'payment.refunded':
      case 'payment.refund.updated':
        await handlePaymentRefunded(event.data);
        break;
      
      default:
        console.log(`Unhandled webhook event type: ${event.type}`);
    }

    return jsonOk({ received: true });
  } catch (error: any) {
    console.error('Webhook processing error:', error);
    return jsonError('Webhook processing failed', 500);
  }
}

/**
 * Handle payment.paid event
 * Triggered when a payment is successfully completed
 */
async function handlePaymentPaid(paymentData: any) {
  const paymentId = paymentData.id;
  
  try {
    // Find payment by PayMongo payment ID
    const payment = await Payment.findOne({ 
      $or: [
        { paymongo_payment_id: paymentId },
        { 'metadata.paymongo_payment_id': paymentId }
      ]
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

    // Get User and Product models for pickup address
    const { User } = await import("@/server/models/User");
    const { Product } = await import("@/server/models/Product");
    
    for (const item of orderItems) {
      // Get seller info for pickup address
      const seller = await User.findById(item.seller_id).lean();
      const product = await Product.findById(item.product_id).lean();
      
      // Prepare pickup address from seller location
      const pickupAddress = seller?.location ? {
        line1: seller.location,
        city: seller.location_coordinates ? undefined : seller.location.split(',')[0] || seller.location,
        coordinates: seller.location_coordinates || undefined,
      } : undefined;
      
      const order = await Order.create({
        buyer_id: payment.buyer_id,
        seller_id: item.seller_id,
        product_id: item.product_id,
        quantity: item.quantity,
        total_price: item.price * item.quantity,
        delivery_address: payment.delivery_address?.line1 || '',
        delivery_address_structured: payment.delivery_address,
        pickup_address: pickupAddress,
        status: "pending",
        payment_status: "paid",
        payment_method: payment.payment_method,
        payment_id: payment._id,
        paymongo_payment_id: paymentId
      });
      
      createdOrders.push(order._id);
      
      // Update product quantity
      await Product.findByIdAndUpdate(item.product_id, {
        $inc: { quantity_available: -item.quantity }
      });
      
      // Remove from cart
      await CartItem.deleteMany({ 
        user_id: payment.buyer_id, 
        product_id: item.product_id 
      });
    }

    // Update payment
    payment.status = 'paid';
    payment.paid_at = new Date();
    payment.paymongo_payment_id = paymentId;
    payment.metadata = {
      ...payment.metadata,
      order_ids: createdOrders,
      paymongo_payment_id: paymentId
    };
    await payment.addWebhookEvent('payment.paid', paymentData);
    await payment.save();

    console.log(`Payment ${payment._id} confirmed via webhook - Orders created: ${createdOrders.length}`);

    // Automatically set up Lalamove delivery for each order (non-blocking)
    // This runs asynchronously and won't fail the payment if it errors
    for (const orderId of createdOrders) {
      autoSetupLalamoveDelivery(String(orderId)).catch((error) => {
        // Log error but don't fail payment
        console.error(`[Payment Webhook] Failed to auto-setup Lalamove for order ${orderId}:`, error);
      });
    }
  } catch (error) {
    console.error(`Error processing payment.paid: ${error}`);
  }
}

/**
 * Handle payment.failed event
 * Triggered when a payment fails
 */
async function handlePaymentFailed(paymentData: any) {
  const paymentId = paymentData.id;
  
  try {
    const payment = await Payment.findOne({ 
      $or: [
        { paymongo_payment_id: paymentId },
        { 'metadata.paymongo_payment_id': paymentId }
      ]
    });

    if (!payment) {
      console.error(`Payment not found for PayMongo payment: ${paymentId}`);
      return;
    }

    payment.status = 'failed';
    payment.failed_at = new Date();
    payment.failure_reason = paymentData.attributes?.failure_message || 
                            paymentData.attributes?.failure_code || 
                            'Payment failed';
    await payment.addWebhookEvent('payment.failed', paymentData);
    await payment.save();

    console.log(`Payment ${payment._id} failed via webhook`);
  } catch (error) {
    console.error(`Error processing payment.failed: ${error}`);
  }
}

/**
 * Handle source.chargeable event
 * Triggered when an e-wallet source (GCash, GrabPay) is ready to be charged
 * We need to create a payment from the source
 */
async function handleSourceChargeable(sourceData: any) {
  const sourceId = sourceData.id;
  
  try {
    const payment = await Payment.findOne({ 
      paymongo_source_id: sourceId 
    });

    if (!payment) {
      console.error(`Payment not found for source: ${sourceId}`);
      return;
    }

    // Check if source is chargeable
    if (sourceData.attributes?.status !== 'chargeable') {
      console.log(`Source ${sourceId} is not chargeable yet. Status: ${sourceData.attributes?.status}`);
      return;
    }

    // Get payment intent ID
    const paymentIntentId = payment.paymongo_payment_intent_id;
    
    if (!paymentIntentId) {
      console.error(`No payment intent found for source ${sourceId}`);
      return;
    }

    // Create payment from chargeable source
    const { createPayment } = await import('@/lib/paymongo');
    const paymongoPayment = await createPayment(paymentIntentId, sourceId);
    
    // Update payment record
    payment.paymongo_payment_id = paymongoPayment.id;
    payment.status = 'processing';
    payment.metadata = {
      ...payment.metadata,
      paymongo_payment_id: paymongoPayment.id
    };
    await payment.addWebhookEvent('source.chargeable', sourceData);
    await payment.save();

    console.log(`Payment created from source ${sourceId}: ${paymongoPayment.id}`);
    
    // Note: The payment.paid event will be triggered separately when payment succeeds
  } catch (error) {
    console.error(`Error processing source.chargeable: ${error}`);
  }
}

/**
 * Handle checkout_session.payment.paid event
 * Triggered when a checkout session payment is completed
 */
async function handleCheckoutSessionPaymentPaid(sessionData: any) {
  const sessionId = sessionData.id;
  
  try {
    // Try to find payment by session metadata or payment ID
    const paymentId = sessionData.attributes?.metadata?.payment_id;
    
    let payment;
    if (paymentId) {
      payment = await Payment.findById(paymentId);
    } else {
      // Fallback: search by any PayMongo identifiers
      payment = await Payment.findOne({
        $or: [
          { paymongo_payment_intent_id: sessionData.attributes?.payment_intent?.id },
          { 'metadata.checkout_session_id': sessionId }
        ]
      });
    }

    if (!payment) {
      console.error(`Payment not found for checkout session: ${sessionId}`);
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
        paymongo_payment_id: sessionData.attributes?.payment?.id
      });
      
      createdOrders.push(order._id);
      
      // Update product quantity
      await Product.findByIdAndUpdate(item.product_id, {
        $inc: { quantity_available: -item.quantity }
      });
      
      // Remove from cart
      await CartItem.deleteMany({ 
        user_id: payment.buyer_id, 
        product_id: item.product_id 
      });
    }

    // Update payment
    payment.status = 'paid';
    payment.paid_at = new Date();
    if (sessionData.attributes?.payment?.id) {
      payment.paymongo_payment_id = sessionData.attributes.payment.id;
    }
    payment.metadata = {
      ...payment.metadata,
      order_ids: createdOrders,
      checkout_session_id: sessionId
    };
    await payment.addWebhookEvent('checkout_session.payment.paid', sessionData);
    await payment.save();

    console.log(`Payment ${payment._id} confirmed via checkout session - Orders created: ${createdOrders.length}`);
  } catch (error) {
    console.error(`Error processing checkout_session.payment.paid: ${error}`);
  }
}

/**
 * Handle payment.refunded and payment.refund.updated events
 * Triggered when a payment is refunded
 */
async function handlePaymentRefunded(paymentData: any) {
  const paymentId = paymentData.id;
  
  try {
    const payment = await Payment.findOne({ 
      $or: [
        { paymongo_payment_id: paymentId },
        { 'metadata.paymongo_payment_id': paymentId }
      ]
    });

    if (!payment) {
      console.error(`Payment not found for PayMongo payment: ${paymentId}`);
      return;
    }

    payment.status = 'refunded';
    payment.metadata = {
      ...payment.metadata,
      refund_amount: paymentData.attributes?.amount || payment.amount,
      refund_reason: paymentData.attributes?.reason || 'Refund processed',
      refund_id: paymentData.attributes?.refund?.id || paymentData.id
    };
    await payment.addWebhookEvent('payment.refunded', paymentData);
    await payment.save();

    console.log(`Payment ${payment._id} refunded via webhook`);
  } catch (error) {
    console.error(`Error processing payment.refunded: ${error}`);
  }
}
