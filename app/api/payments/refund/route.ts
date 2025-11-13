import { NextRequest } from "next/server";
import { requireMethod, jsonError, jsonOk, getAuthToken } from "@/server/utils/api";
import { verifyToken } from "@/server/utils/auth";
import { connectToDatabase } from "@/server/lib/mongodb";
import { validateUserRole } from "@/server/utils/role-validation";
import { Payment } from "@/server/models/Payment";
import { Order } from "@/server/models/Product";
import { RefundRequestSchema, convertToCentavos } from "@/server/validators/payment";
import { createRefund, PayMongoError } from "@/lib/paymongo";

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
    const result = RefundRequestSchema.safeParse(body);

    if (!result.success) {
      return jsonError(result.error.issues[0].message, 400);
    }

    const { payment_id, amount, reason } = result.data;

    await connectToDatabase();

    // Check if user has buyer role
    try {
      const { user, userId } = await validateUserRole(req, ["buyer"]);
    } catch (roleError: any) {
      return jsonError(roleError.message, 403);
    }

    const userId = decoded.sub;

    // Find payment
    const payment = await Payment.findOne({ 
      _id: payment_id,
      buyer_id: userId 
    });

    if (!payment) {
      return jsonError("Payment not found", 404);
    }

    // Check if payment is eligible for refund
    if (payment.status !== 'paid') {
      return jsonError("Only paid payments can be refunded", 400);
    }

    if (payment.payment_method === 'cod') {
      return jsonError("Cash on Delivery payments cannot be refunded online", 400);
    }

    if (!payment.paymongo_payment_id) {
      return jsonError("Payment ID not found for refund processing", 400);
    }

    // Calculate refund amount
    const refundAmount = amount ? convertToCentavos(amount) : 0; // 0 means full refund
    const maxRefundAmount = payment.amount;

    if (refundAmount > maxRefundAmount) {
      return jsonError(`Refund amount cannot exceed payment amount (₱${maxRefundAmount / 100})`, 400);
    }

    // Check if there are any existing refunds
    const existingRefunds = payment.metadata?.refunds || [];
    const totalRefunded = existingRefunds.reduce((sum: number, refund: any) => sum + refund.amount, 0);

    if (totalRefunded >= maxRefundAmount) {
      return jsonError("Payment has already been fully refunded", 400);
    }

    const remainingAmount = maxRefundAmount - totalRefunded;
    const actualRefundAmount = refundAmount === 0 ? remainingAmount : refundAmount;

    if (actualRefundAmount > remainingAmount) {
      return jsonError(`Refund amount exceeds remaining refundable amount (₱${remainingAmount / 100})`, 400);
    }

    try {
      // Create refund with PayMongo
      const refund = await createRefund(
        payment.paymongo_payment_id,
        actualRefundAmount,
        reason
      );

      // Update payment record
      const refundRecord = {
        id: refund.id,
        amount: actualRefundAmount,
        reason: reason,
        status: refund.attributes.status,
        created_at: new Date(),
        paymongo_refund_id: refund.id
      };

      payment.metadata = {
        ...payment.metadata,
        refunds: [...existingRefunds, refundRecord]
      };

      // Update payment status if fully refunded
      if (totalRefunded + actualRefundAmount >= maxRefundAmount) {
        payment.status = 'refunded';
      }

      await payment.save();

      // Update related orders
      if (payment.metadata?.order_ids) {
        await Order.updateMany(
          { _id: { $in: payment.metadata.order_ids } },
          { 
            payment_status: totalRefunded + actualRefundAmount >= maxRefundAmount ? 'refunded' : 'partially_refunded',
            refund_amount: totalRefunded + actualRefundAmount
          }
        );
      }

      return jsonOk({
        success: true,
        refund_id: refund.id,
        payment_id: payment._id,
        amount: actualRefundAmount / 100, // Convert to pesos
        currency: payment.currency,
        status: refund.attributes.status,
        reason: reason,
        message: "Refund request submitted successfully"
      });
    } catch (paymongoError: any) {
      console.error('PayMongo refund error:', paymongoError);
      return jsonError(`Refund processing failed: ${paymongoError.message}`, 500);
    }
  } catch (error: any) {
    console.error("Refund error:", error);
    return jsonError(error.message || "Failed to process refund", 500);
  }
}

export async function GET(req: NextRequest) {
  const mm = requireMethod(req, ["GET"]);
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
    const { searchParams } = new URL(req.url);
    const paymentId = searchParams.get('payment_id');

    if (!paymentId) {
      return jsonError("Payment ID is required", 400);
    }

    await connectToDatabase();

    // Check if user has buyer role
    try {
      const { user, userId } = await validateUserRole(req, ["buyer"]);
    } catch (roleError: any) {
      return jsonError(roleError.message, 403);
    }

    const userId = decoded.sub;

    // Find payment
    const payment = await Payment.findOne({ 
      _id: paymentId,
      buyer_id: userId 
    });

    if (!payment) {
      return jsonError("Payment not found", 404);
    }

    // Return refund information
    type PaymentRefundMetadata = {
      id: string;
      amount: number;
      reason?: string;
      status?: string;
      created_at?: Date | string;
    };

    const refunds: PaymentRefundMetadata[] = Array.isArray(payment.metadata?.refunds)
      ? (payment.metadata?.refunds as PaymentRefundMetadata[])
      : [];

    const totalRefunded = refunds.reduce((sum, refund) => sum + (refund.amount || 0), 0);
    const remainingRefundable = payment.amount - totalRefunded;

    return jsonOk({
      payment_id: payment._id,
      total_amount: payment.amount / 100, // Convert to pesos
      total_refunded: totalRefunded / 100,
      remaining_refundable: remainingRefundable / 100,
      currency: payment.currency,
      refunds: refunds.map((refund) => ({
        id: refund.id,
        amount: refund.amount / 100,
        reason: refund.reason,
        status: refund.status,
        created_at: refund.created_at
      })),
      can_refund: remainingRefundable > 0 && payment.status === 'paid'
    });
  } catch (error: any) {
    console.error("Get refunds error:", error);
    return jsonError(error.message || "Failed to get refund information", 500);
  }
}
