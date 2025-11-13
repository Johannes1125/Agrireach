import { NextRequest } from "next/server";
import { requireMethod, jsonError, jsonOk, getAuthToken } from "@/server/utils/api";
import { verifyToken } from "@/server/utils/auth";
import { connectToDatabase } from "@/server/lib/mongodb";
import { validateUserRole } from "@/server/utils/role-validation";
import { Payment } from "@/server/models/Payment";
import { PaymentFilterSchema } from "@/server/validators/payment";

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
    const queryParams = Object.fromEntries(searchParams.entries());
    
    // Parse numeric parameters for validation (without mutating original string values)
    const parsedQueryParams = {
      ...queryParams,
      page: queryParams.page ? parseInt(queryParams.page, 10) : undefined,
      limit: queryParams.limit ? parseInt(queryParams.limit, 10) : undefined,
    };

    const result = PaymentFilterSchema.safeParse(parsedQueryParams);

    if (!result.success) {
      return jsonError(result.error.issues[0].message, 400);
    }

    const { status, payment_method, date_from, date_to, buyer_id, seller_id, page, limit } = result.data;

    await connectToDatabase();

    // Check user role
    try {
      const { user, userId } = await validateUserRole(req, ["buyer", "admin"]);
    } catch (roleError: any) {
      return jsonError(roleError.message, 403);
    }

    const userId = decoded.sub;

    // Build filter query
    const filter: any = {};

    // Role-based filtering
    if (buyer_id) {
      filter.buyer_id = buyer_id;
    } else if (seller_id) {
      filter.seller_id = seller_id;
    } else {
      // Default: show user's own payments
      filter.$or = [
        { buyer_id: userId },
        { seller_id: userId }
      ];
    }

    // Additional filters
    if (status) filter.status = status;
    if (payment_method) filter.payment_method = payment_method;
    
    if (date_from || date_to) {
      filter.created_at = {};
      if (date_from) filter.created_at.$gte = new Date(date_from);
      if (date_to) filter.created_at.$lte = new Date(date_to);
    }

    // Execute query with pagination
    const skip = (page - 1) * limit;
    
    const [payments, total] = await Promise.all([
      Payment.find(filter)
        .populate('buyer_id', 'full_name email avatar_url')
        .populate('seller_id', 'full_name email avatar_url')
        .populate('order_id')
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Payment.countDocuments(filter)
    ]);

    // Format response
    const formattedPayments = payments.map(payment => {
      const buyer = payment.buyer_id as any;
      const seller = payment.seller_id as any;
      return {
        id: payment._id,
        amount: payment.amount / 100, // Convert to pesos
        currency: payment.currency,
        description: payment.description,
        payment_method: payment.payment_method,
        payment_type: payment.payment_type,
        status: payment.status,
        failure_reason: payment.failure_reason,
        paid_at: payment.paid_at,
        failed_at: payment.failed_at,
        cancelled_at: payment.cancelled_at,
        created_at: payment.created_at,
        updated_at: payment.updated_at,
        expires_at: payment.expires_at,
        buyer: buyer ? {
          id: buyer._id,
          name: buyer.full_name,
          email: buyer.email,
          avatar: buyer.avatar_url
        } : null,
        seller: seller ? {
          id: seller._id,
          name: seller.full_name,
          email: seller.email,
          avatar: seller.avatar_url
        } : null,
        order: payment.order_id,
        billing_details: payment.billing_details,
        delivery_address: payment.delivery_address,
        metadata: payment.metadata
      };
    });

    return jsonOk({
      payments: formattedPayments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasNext: skip + limit < total,
        hasPrev: page > 1
      }
    });
  } catch (error: any) {
    console.error("Get payments error:", error);
    return jsonError(error.message || "Failed to get payments", 500);
  }
}

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
    const { payment_id } = body;

    if (!payment_id) {
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
      _id: payment_id,
      buyer_id: userId 
    });

    if (!payment) {
      return jsonError("Payment not found", 404);
    }

    // Return payment details
    const formattedPayment = {
      id: payment._id,
      amount: payment.amount / 100, // Convert to pesos
      currency: payment.currency,
      description: payment.description,
      payment_method: payment.payment_method,
      payment_type: payment.payment_type,
      status: payment.status,
      failure_reason: payment.failure_reason,
      paid_at: payment.paid_at,
      failed_at: payment.failed_at,
      cancelled_at: payment.cancelled_at,
      created_at: payment.created_at,
      updated_at: payment.updated_at,
      expires_at: payment.expires_at,
      billing_details: payment.billing_details,
      delivery_address: payment.delivery_address,
      metadata: payment.metadata,
      paymongo_payment_intent_id: payment.paymongo_payment_intent_id,
      paymongo_source_id: payment.paymongo_source_id,
      paymongo_payment_id: payment.paymongo_payment_id,
      paymongo_client_key: payment.paymongo_client_key
    };

    return jsonOk({ payment: formattedPayment });
  } catch (error: any) {
    console.error("Get payment error:", error);
    return jsonError(error.message || "Failed to get payment", 500);
  }
}
