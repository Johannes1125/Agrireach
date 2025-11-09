import { NextRequest } from "next/server";
import { jsonError, jsonOk } from "@/server/utils/api";
import { connectToDatabase } from "@/server/lib/mongodb";
import { Payment } from "@/server/models/Payment";
import { Order, Product, CartItem } from "@/server/models/Product";
import { verifyWebhookSignature, STRIPE_CONFIG } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get('stripe-signature') || '';
    
    if (!STRIPE_CONFIG.webhookSecret) {
      console.error('Stripe webhook secret is not configured');
      return jsonError('Webhook secret not configured', 500);
    }

    // Verify webhook signature
    let event;
    try {
      event = verifyWebhookSignature(body, signature, STRIPE_CONFIG.webhookSecret);
    } catch (error: any) {
      console.error('Invalid webhook signature:', error);
      return jsonError('Invalid signature', 401);
    }

    console.log(`Received Stripe webhook: ${event.type}`, event.id);

    await connectToDatabase();

    // Handle different webhook events
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object);
        break;
      
      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object);
        break;
      
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object);
        break;
      
      case 'checkout.session.async_payment_succeeded':
        await handleCheckoutSessionAsyncPaymentSucceeded(event.data.object);
        break;
      
      case 'checkout.session.async_payment_failed':
        await handleCheckoutSessionAsyncPaymentFailed(event.data.object);
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

async function handlePaymentIntentSucceeded(paymentIntent: any) {
  const paymentIntentId = paymentIntent.id;
  
  try {
    const payment = await Payment.findOne({ 
      stripe_payment_intent_id: paymentIntentId 
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
        stripe_payment_intent_id: paymentIntentId
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
    payment.metadata = {
      ...payment.metadata,
      order_ids: createdOrders
    };
    await payment.addWebhookEvent('payment_intent.succeeded', paymentIntent);
    await payment.save();

    console.log(`Payment ${payment._id} confirmed via webhook`);
  } catch (error) {
    console.error(`Error processing payment intent succeeded: ${error}`);
  }
}

async function handlePaymentIntentFailed(paymentIntent: any) {
  const paymentIntentId = paymentIntent.id;
  
  try {
    const payment = await Payment.findOne({ 
      stripe_payment_intent_id: paymentIntentId 
    });

    if (!payment) {
      console.error(`Payment not found for intent: ${paymentIntentId}`);
      return;
    }

    payment.status = 'failed';
    payment.failed_at = new Date();
    payment.failure_reason = paymentIntent.last_payment_error?.message || 'Payment failed';
    await payment.addWebhookEvent('payment_intent.payment_failed', paymentIntent);
    await payment.save();

    console.log(`Payment ${payment._id} failed via webhook`);
  } catch (error) {
    console.error(`Error processing payment intent failed: ${error}`);
  }
}

async function handleCheckoutSessionCompleted(session: any) {
  const sessionId = session.id;
  
  try {
    const payment = await Payment.findOne({ 
      stripe_checkout_session_id: sessionId 
    });

    if (!payment) {
      console.error(`Payment not found for session: ${sessionId}`);
      return;
    }

    if (payment.status === 'paid') {
      console.log(`Payment ${payment._id} already processed`);
      return;
    }

    // If payment was successful, create orders
    if (session.payment_status === 'paid') {
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
          stripe_checkout_session_id: sessionId
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
      payment.metadata = {
        ...payment.metadata,
        order_ids: createdOrders
      };
      await payment.addWebhookEvent('checkout.session.completed', session);
      await payment.save();

      console.log(`Payment ${payment._id} confirmed via checkout session`);
    }
  } catch (error) {
    console.error(`Error processing checkout session completed: ${error}`);
  }
}

async function handleCheckoutSessionAsyncPaymentSucceeded(session: any) {
  // Similar to handleCheckoutSessionCompleted
  await handleCheckoutSessionCompleted(session);
}

async function handleCheckoutSessionAsyncPaymentFailed(session: any) {
  const sessionId = session.id;
  
  try {
    const payment = await Payment.findOne({ 
      stripe_checkout_session_id: sessionId 
    });

    if (!payment) {
      console.error(`Payment not found for session: ${sessionId}`);
      return;
    }

    payment.status = 'failed';
    payment.failed_at = new Date();
    payment.failure_reason = 'Payment failed';
    await payment.addWebhookEvent('checkout.session.async_payment_failed', session);
    await payment.save();

    console.log(`Payment ${payment._id} failed via checkout session`);
  } catch (error) {
    console.error(`Error processing checkout session async payment failed: ${error}`);
  }
}

