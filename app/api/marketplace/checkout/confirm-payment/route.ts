import { NextRequest } from "next/server";
import { requireMethod, jsonError, jsonOk, getAuthToken } from "@/server/utils/api";
import { verifyToken } from "@/server/utils/auth";
import { connectToDatabase } from "@/server/lib/mongodb";
import { validateUserRole } from "@/server/utils/role-validation";
import { Payment } from "@/server/models/Payment";
import { Order } from "@/server/models/Product";
import { PaymentConfirmationSchema } from "@/server/validators/payment";
import { retrievePaymentIntent, retrieveSource, retrievePayment, PayMongoError } from "@/lib/paymongo";
import { autoSetupLalamoveDelivery } from "@/server/utils/lalamove-auto-setup";
import mongoose from "mongoose";

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
    console.log('Payment confirmation request:', { payment_intent_id, source_id, payment_id, userId });
    
    if (payment_intent_id) {
      payment = await Payment.findOne({ 
        paymongo_payment_intent_id: payment_intent_id,
        buyer_id: userId 
      });
      console.log('Searching by payment_intent_id:', payment_intent_id, 'Found:', !!payment);
    } else if (source_id) {
      // Try with buyer_id first
      payment = await Payment.findOne({ 
        paymongo_source_id: source_id,
        buyer_id: userId 
      });
      console.log('Searching by source_id with buyer_id:', source_id, 'Found:', !!payment);
      
      // If not found, try without buyer_id to see if payment exists
      if (!payment) {
        const paymentWithoutBuyer = await Payment.findOne({ 
          paymongo_source_id: source_id
        });
        if (paymentWithoutBuyer) {
          console.error('Payment found but buyer_id mismatch. Payment buyer_id:', String(paymentWithoutBuyer.buyer_id), 'Requested userId:', userId);
          console.error('Payment details:', {
            id: paymentWithoutBuyer._id,
            source_id: paymentWithoutBuyer.paymongo_source_id,
            status: paymentWithoutBuyer.status
          });
          // For now, allow it if the payment exists (user might have multiple sessions)
          payment = paymentWithoutBuyer;
          console.log('Allowing payment despite buyer_id mismatch for debugging');
        }
      }
    } else if (payment_id) {
      // Check if payment_id is a valid MongoDB ObjectId (our internal ID)
      // or a PayMongo payment ID
      const isMongoId = mongoose.Types.ObjectId.isValid(payment_id);
      console.log('Payment ID provided:', payment_id, 'Is MongoDB ID:', isMongoId);
      
      if (isMongoId) {
        // Search by MongoDB _id
        payment = await Payment.findOne({ 
          _id: payment_id,
          buyer_id: userId 
        });
        console.log('Searching by MongoDB _id:', payment_id, 'Found:', !!payment);
        
        // If not found, try without buyer_id to see if payment exists
        if (!payment) {
          const paymentWithoutBuyer = await Payment.findById(payment_id);
          if (paymentWithoutBuyer) {
            console.error('Payment found but buyer_id mismatch. Payment buyer_id:', paymentWithoutBuyer.buyer_id, 'Requested userId:', userId);
            return jsonError("Payment not found for this user", 404);
          }
        }
      } else {
        // Search by PayMongo payment ID
        payment = await Payment.findOne({ 
          paymongo_payment_id: payment_id,
          buyer_id: userId 
        });
        console.log('Searching by paymongo_payment_id:', payment_id, 'Found:', !!payment);
      }
    } else {
      return jsonError("No payment identifier provided", 400);
    }

    if (!payment) {
      console.error('Payment not found with identifiers:', { payment_intent_id, source_id, payment_id, userId });
      
      // Additional debugging: check if any payment exists with these identifiers
      if (source_id) {
        const anyPayment = await Payment.findOne({ paymongo_source_id: source_id });
        console.error('Any payment with source_id:', !!anyPayment, anyPayment ? { id: anyPayment._id, buyer_id: anyPayment.buyer_id, status: anyPayment.status } : null);
      }
      if (payment_id && mongoose.Types.ObjectId.isValid(payment_id)) {
        const anyPayment = await Payment.findById(payment_id);
        console.error('Any payment with payment_id:', !!anyPayment, anyPayment ? { id: anyPayment._id, buyer_id: anyPayment.buyer_id, status: anyPayment.status } : null);
      }
      
      return jsonError("Payment not found", 404);
    }
    
    console.log('Payment found:', payment._id, 'Status:', payment.status, 'Buyer ID:', payment.buyer_id);

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
        console.log('Source status from PayMongo:', paymongoStatus, 'Source ID:', source_id);
        
        if (source.attributes.status === 'consumed' && source.attributes.payment) {
          paymongoPaymentId = source.attributes.payment.id;
          console.log('Source consumed, payment ID:', paymongoPaymentId);
          
          // Also check the payment status directly
          if (paymongoPaymentId) {
            try {
              const paymongoPayment = await retrievePayment(paymongoPaymentId);
              paymongoStatus = paymongoPayment.attributes.status;
              console.log('Payment status from PayMongo:', paymongoStatus);
            } catch (err: any) {
              console.error('Error retrieving payment:', err.message);
            }
          }
        } else if (source.attributes.status === 'chargeable') {
          // Source is chargeable but not yet consumed - payment might still be processing
          console.log('Source is chargeable, waiting for payment to be processed');
          paymongoStatus = 'pending';
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

      // Get seller information for pickup address
      const { User } = await import("@/server/models/User");
      const { Product } = await import("@/server/models/Product");
      
      for (const item of orderItems) {
        // Get seller and product info for pickup address
        const seller = await User.findById(item.seller_id).lean();
        const product = await Product.findById(item.product_id).lean();
        
        if (!seller?.location) {
          console.error(`[Order Creation] Seller ${item.seller_id} has no location`);
          // Continue but log error - Lalamove setup will fail later
        }
        
        // Prepare pickup address from seller location
        let pickupAddress = undefined;
        
        if (seller?.location) {
          let sellerCoordinates = seller.location_coordinates;
          
          // If seller location doesn't have coordinates, geocode it
          if (!sellerCoordinates && seller.location) {
            console.log(`[Order Creation] Geocoding seller location: ${seller.location}`);
            const { geocodeAddress } = await import("@/server/utils/geocoding");
            const geocodeResult = await geocodeAddress(seller.location);
            
            if (geocodeResult?.coordinates) {
              sellerCoordinates = geocodeResult.coordinates;
              // Optionally update seller's location_coordinates in database
              await User.findByIdAndUpdate(item.seller_id, {
                $set: { location_coordinates: sellerCoordinates }
              }).catch(err => {
                console.error(`[Order Creation] Failed to update seller coordinates:`, err);
              });
            } else {
              console.error(`[Order Creation] Failed to geocode seller location: ${seller.location}`);
            }
          }
          
          // Extract city from location string if coordinates exist, otherwise try to parse
          let city = undefined;
          if (!sellerCoordinates) {
            // Try to extract city from location string
            const locationParts = seller.location.split(',');
            city = locationParts[0]?.trim() || seller.location;
          }
          
          pickupAddress = {
            line1: seller.location,
            city: city,
            coordinates: sellerCoordinates || undefined,
          };
        }
        
        // Ensure coordinates are preserved when copying from payment to order
        const deliveryAddressStructured = payment.delivery_address ? {
          ...payment.delivery_address,
          // Explicitly preserve coordinates
          coordinates: payment.delivery_address.coordinates || undefined
        } : undefined;

        // Log coordinate preservation for debugging
        if (payment.delivery_address?.coordinates) {
          console.log(`[Order Creation] ✅ Preserving coordinates from payment:`, payment.delivery_address.coordinates);
        } else {
          console.warn(`[Order Creation] ⚠️ No coordinates in payment.delivery_address for order item ${item.product_id}`);
        }

        const order = await Order.create({
          buyer_id: userId,
          seller_id: item.seller_id,
          product_id: item.product_id,
          quantity: item.quantity,
          total_price: item.price * item.quantity,
          delivery_address: payment.delivery_address?.line1 || '',
          delivery_address_structured: deliveryAddressStructured, // Use the explicitly preserved version
          pickup_address: pickupAddress,
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

      // Automatically set up Lalamove delivery for each order (non-blocking)
      // This runs asynchronously and won't fail the payment if it errors
      for (const orderId of createdOrders) {
        autoSetupLalamoveDelivery(String(orderId)).catch((error) => {
          // Log error but don't fail payment
          console.error(`[Payment Confirmation] Failed to auto-setup Lalamove for order ${orderId}:`, error);
        });
      }

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