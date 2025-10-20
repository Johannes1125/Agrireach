import { NextRequest } from "next/server";
import { requireMethod, jsonError, jsonOk, getAuthToken } from "@/server/utils/api";
import { verifyToken } from "@/server/utils/auth";
import { connectToDatabase } from "@/server/lib/mongodb";
import { validateUserRole } from "@/server/utils/role-validation";
import { Product, CartItem, Order } from "@/server/models/Product";
import { Payment } from "@/server/models/Payment";
import { CheckoutRequestSchema, convertToCentavos, PAYMENT_ERRORS } from "@/server/validators/payment";
import { createPaymentIntent, createSource, PayMongoError } from "@/lib/paymongo";

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
    console.log("Received request body:", body);
    console.log("Body type:", typeof body);
    console.log("Body keys:", Object.keys(body || {}));
    
    const result = CheckoutRequestSchema.safeParse(body);

    if (!result.success) {
      console.error("Validation error:", result.error.issues);
      const firstError = result.error.issues[0];
      return jsonError(firstError.message || "Validation failed", 400, {
        field: firstError.path.join('.'),
        code: firstError.code
      });
    }

    const { items: cartItemIds, delivery_address, delivery_address_structured, payment_method, billing_details } = result.data;
    
    console.log("Payment method received:", payment_method);

    await connectToDatabase();

    // Check if user has buyer role
    try {
      const { user, userId } = await validateUserRole(req, ["buyer"]);
    } catch (roleError: any) {
      return jsonError(roleError.message, 403);
    }

    const userId = decoded.sub;

    // Get cart items with populated products
    const cartItems = await CartItem.find({ 
      user_id: userId, 
      _id: { $in: cartItemIds } 
    }).populate('product_id');

    if (cartItems.length === 0) {
      return jsonError("No items found in cart", 404);
    }

    // Validate all products are available and calculate totals
    const orderItems = [];
    let totalAmount = 0;

    for (const cartItem of cartItems) {
      const product = cartItem.product_id as any;
      
      if (!product) {
        return jsonError(`Product not found for cart item ${cartItem._id}`, 404);
      }

      if (product.status !== 'active') {
        return jsonError(`Product "${product.title}" is not available for purchase`, 400);
      }

      if (product.quantity_available < cartItem.quantity) {
        return jsonError(`Insufficient stock for "${product.title}". Available: ${product.quantity_available}`, 400);
      }

      const itemTotal = product.price * cartItem.quantity;
      totalAmount += itemTotal;

      orderItems.push({
        product_id: product._id.toString(),
        quantity: cartItem.quantity,
        price: product.price,
        seller_id: product.seller_id.toString()
      });
    }

    // Create payment record
    const payment = new Payment({
      buyer_id: userId,
      amount: convertToCentavos(totalAmount),
      currency: 'PHP',
      description: `AgriReach order - ${orderItems.length} item(s)`,
      payment_method: payment_method,
      payment_type: 'one_time',
      status: 'pending',
      billing_details: billing_details,
      delivery_address: typeof delivery_address === 'object' ? delivery_address : delivery_address_structured,
      metadata: {
        order_items: orderItems,
        cart_item_ids: cartItemIds
      },
      expires_at: new Date(Date.now() + 30 * 60 * 1000) // 30 minutes
    });

    await payment.save();

    // Handle different payment methods
    if (payment_method === "cod") {
      // For Cash on Delivery, create orders directly
      const createdOrders = [];
      
      for (const item of orderItems) {
        const cartItem = cartItems.find(ci => ci.product_id._id.toString() === item.product_id);
        const product = cartItem?.product_id as any;
        
        const order = await Order.create({
          buyer_id: userId,
          seller_id: item.seller_id,
          product_id: item.product_id,
          quantity: item.quantity,
          total_price: item.price * item.quantity,
          delivery_address: typeof delivery_address === "string" ? delivery_address : (delivery_address_structured ? delivery_address_structured.line1 || "" : ""),
          delivery_address_structured: typeof delivery_address === "object" ? delivery_address : delivery_address_structured,
          status: "pending",
          payment_status: "pending",
          payment_method: "cod",
          payment_id: payment._id
        });
        
        createdOrders.push(order._id);
        
        // Update product quantity
        await Product.findByIdAndUpdate(item.product_id, {
          $inc: { quantity_available: -item.quantity }
        });
        
        // Remove from cart
        await CartItem.deleteOne({ user_id: userId, product_id: item.product_id });
      }

      // Update payment status
      payment.status = 'paid';
      payment.paid_at = new Date();
      await payment.save();

      return jsonOk({
        success: true,
        payment_type: "cod",
        payment_id: payment._id,
        order_ids: createdOrders,
        amount: totalAmount,
        currency: "PHP",
        status: "paid",
        message: "Order successfully placed! Payment will be collected upon delivery.",
        redirect_url: "/dashboard/orders",
        order_items: orderItems,
        delivery_address: delivery_address_structured || delivery_address,
        billing_details,
      });
    } 
    else if (payment_method === "gcash" || payment_method === "grab_pay") {
      // For e-wallet payments, create a source
      try {
        const source = await createSource({
          type: payment_method,
          amount: convertToCentavos(totalAmount),
          currency: 'PHP',
          redirect: {
            success: `${process.env.BASE_URL || 'http://localhost:3000'}/marketplace/payment/success?payment_id=${payment._id}`,
            failed: `${process.env.BASE_URL || 'http://localhost:3000'}/marketplace/payment/failed?payment_id=${payment._id}`
          },
          billing: {
            name: billing_details.name,
            email: billing_details.email,
            phone: billing_details.phone || ''
          }
        });

        // Update payment with source info
        payment.paymongo_source_id = source.id;
        payment.paymongo_client_key = source.attributes.client_key;
        payment.status = 'processing';
        await payment.save();

        return jsonOk({
          success: true,
          payment_type: "source",
          payment_id: payment._id,
          source_id: source.id,
          checkout_url: source.attributes.redirect.check_url,
          amount: totalAmount,
          currency: "PHP",
          status: "processing",
          message: "Redirecting to payment...",
          order_items: orderItems,
          delivery_address: delivery_address_structured || delivery_address,
          billing_details,
        });
      } catch (paymongoError: any) {
        console.error('PayMongo source creation error:', paymongoError);
        payment.status = 'failed';
        payment.failure_reason = paymongoError.message;
        await payment.save();
        
        return jsonError(`Payment processing failed: ${paymongoError.message}`, 500);
      }
    } 
    else if (payment_method === "card") {
      // For card payments, create a payment intent
      try {
        const paymentIntent = await createPaymentIntent({
          amount: convertToCentavos(totalAmount),
          currency: 'PHP',
          description: `AgriReach order - ${orderItems.length} item(s)`,
          payment_method_allowed: ['card'],
          metadata: {
            payment_id: payment._id.toString(),
            buyer_id: userId,
            order_items: orderItems
          }
        });

        // Update payment with intent info
        payment.paymongo_payment_intent_id = paymentIntent.id;
        payment.paymongo_client_key = paymentIntent.attributes.client_key;
        payment.status = 'processing';
        await payment.save();

        return jsonOk({
          success: true,
          payment_type: "card",
          payment_id: payment._id,
          payment_intent_id: paymentIntent.id,
          client_key: paymentIntent.attributes.client_key,
          amount: totalAmount,
          currency: "PHP",
          status: "processing",
          message: "Card payment ready. Please complete payment on the next step.",
          order_items: orderItems,
          delivery_address: delivery_address_structured || delivery_address,
          billing_details,
        });
      } catch (paymongoError: any) {
        console.error('PayMongo payment intent creation error:', paymongoError);
        payment.status = 'failed';
        payment.failure_reason = paymongoError.message;
        await payment.save();
        
        return jsonError(`Payment processing failed: ${paymongoError.message}`, 500);
      }
    } else {
      return jsonError("Unsupported payment method", 400);
    }
  } catch (error: any) {
    console.error("Checkout error:", error);
    console.error("Error type:", typeof error);
    console.error("Error message:", error?.message);
    console.error("Error stack:", error?.stack);
    return jsonError(error?.message || "Failed to process checkout", 500);
  }
}