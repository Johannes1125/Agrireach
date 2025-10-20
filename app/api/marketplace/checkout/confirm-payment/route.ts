import { NextRequest } from "next/server";
import { requireMethod, jsonError, jsonOk, getAuthToken } from "@/server/utils/api";
import { verifyToken } from "@/server/utils/auth";
import { connectToDatabase } from "@/server/lib/mongodb";
import { validateUserRole } from "@/server/utils/role-validation";
import { Payment } from "@/server/models/Payment";
import { Order } from "@/server/models/Product";
import { PaymentConfirmationSchema } from "@/server/validators/payment";
import { retrievePaymentIntent, retrieveSource, retrievePayment, PayMongoError } from "@/lib/paymongo";

export async function POST(req: NextRequest) {
  const mm = requireMethod(req, ["POST"]);
  if (mm) return mm;

  const token = getAuthToken(req, "access");
  if (!token) return jsonError("Unauthorized", 401);

  let decoded: any;
  try {
    decoded = verifyToken<any>(token, "access");
  } catch {
    return jsonError("Unauthorized", 401);
  }

  try {
    const body = await req.json();
    const result = PaymentConfirmationSchema.safeParse(body);

    if (!result.success) {
      return jsonError(result.error.issues[0].message, 400);
    }

    const { payment_intent_id, source_id, payment_id } = result.data;

    await connectToDatabase();

    // Check if user has buyer role
    try {
      const { user, userId } = await validateUserRole(req, ["buyer"]);
    } catch (roleError: any) {
      return jsonError(roleError.message, 403);
    }

    const userId = decoded.sub;

    // Find the payment record
    let payment;
    if (payment_intent_id) {
      payment = await Payment.findOne({ 
        paymongo_payment_intent_id: payment_intent_id,
        buyer_id: userId 
      });
    } else if (source_id) {
      payment = await Payment.findOne({ 
        paymongo_source_id: source_id,
        buyer_id: userId 
      });
    } else if (payment_id) {
      payment = await Payment.findOne({ 
        paymongo_payment_id: payment_id,
        buyer_id: userId 
      });
    } else {
      return jsonError("No payment identifier provided", 400);
    }

    if (!payment) {
      return jsonError("Payment not found", 404);
    }

    // Check if payment is already processed
    if (payment.status === 'paid') {
      return jsonOk({
        success: true,
        payment_id: payment._id,
        status: 'paid',
        message: 'Payment already confirmed',
        order_ids: payment.metadata?.order_ids || []
      });
    }

    // Verify payment status with PayMongo
    let paymongoStatus = 'pending';
    let paymongoPaymentId = null;

    try {
      if (payment_intent_id) {
        const paymentIntent = await retrievePaymentIntent(payment_intent_id);
        paymongoStatus = paymentIntent.attributes.status;
        
        if (paymentIntent.attributes.payment_method_allowed?.includes('card')) {
          // For card payments, check if there's an attached payment
          if (paymentIntent.attributes.payments?.length > 0) {
            const latestPayment = paymentIntent.attributes.payments[paymentIntent.attributes.payments.length - 1];
            paymongoPaymentId = latestPayment.id;
          }
        }
      } else if (source_id) {
        const source = await retrieveSource(source_id);
        paymongoStatus = source.attributes.status;
        
        if (source.attributes.status === 'consumed' && source.attributes.payment) {
          paymongoPaymentId = source.attributes.payment.id;
        }
      } else if (payment_id) {
        const paymongoPayment = await retrievePayment(payment_id);
        paymongoStatus = paymongoPayment.attributes.status;
        paymongoPaymentId = payment_id;
      }
    } catch (paymongoError: any) {
      console.error('PayMongo verification error:', paymongoError);
      return jsonError(`Payment verification failed: ${paymongoError.message}`, 500);
    }

    // Update payment status based on PayMongo response
    if (paymongoStatus === 'paid' || paymongoStatus === 'succeeded') {
      // Payment successful - create orders
      const orderItems = payment.metadata?.order_items || [];
      const createdOrders = [];

      for (const item of orderItems) {
        const order = await Order.create({
          buyer_id: userId,
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
          paymongo_payment_id: paymongoPaymentId
        });
        
        createdOrders.push(order._id);
      }

      // Update payment record
      payment.status = 'paid';
      payment.paid_at = new Date();
      payment.paymongo_payment_id = paymongoPaymentId;
      payment.metadata = {
        ...payment.metadata,
        order_ids: createdOrders
      };
      await payment.save();

      return jsonOk({
        success: true,
        payment_id: payment._id,
        status: 'paid',
        message: 'Payment confirmed successfully!',
        order_ids: createdOrders,
        amount: payment.amount / 100, // Convert back to pesos
        currency: payment.currency
      });
    } else if (paymongoStatus === 'failed' || paymongoStatus === 'cancelled') {
      // Payment failed
      payment.status = 'failed';
      payment.failed_at = new Date();
      payment.failure_reason = `Payment ${paymongoStatus} by PayMongo`;
      await payment.save();

      return jsonError(`Payment ${paymongoStatus}`, 400);
    } else {
      // Payment still pending
      return jsonOk({
        success: false,
        payment_id: payment._id,
        status: 'pending',
        message: 'Payment is still being processed',
        paymongo_status: paymongoStatus
      });
    }
  } catch (error: any) {
    console.error("Payment confirmation error:", error);
    return jsonError(error.message || "Failed to confirm payment", 500);
  }
}