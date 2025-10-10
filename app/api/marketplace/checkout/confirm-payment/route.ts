import { NextRequest } from "next/server";
import { requireMethod, jsonError, jsonOk, getAuthToken } from "@/server/utils/api";
import { verifyToken } from "@/server/utils/auth";
import { connectToDatabase } from "@/server/lib/mongodb";
import { CartItem, Product, Order } from "@/server/models/Product";
import { User } from "@/server/models/User";
import { Notification } from "@/server/models/Notification";
import { retrievePaymentIntent, retrieveSource } from "@/lib/paymongo";
import { hasRole, getRoleErrorMessage } from "@/server/utils/role-validation";
import { z } from "zod";

const ConfirmPaymentSchema = z.object({
  payment_intent_id: z.string().optional(),
  source_id: z.string().optional(),
  cart_item_ids: z.array(z.string()),
  delivery_address: z.string(),
});

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
    const result = ConfirmPaymentSchema.safeParse(body);

    if (!result.success) {
      return jsonError(result.error.errors[0].message, 400);
    }

    const { payment_intent_id, source_id, cart_item_ids, delivery_address } = result.data;

    await connectToDatabase();

    // Check if user has buyer role
    const user = await User.findById(decoded.sub).select("roles role").lean();
    if (!user) return jsonError("User not found", 404);
    
    const userRoles = user.roles || [user.role];
    if (!hasRole(userRoles, "buyer")) {
      return jsonError(getRoleErrorMessage("buyer"), 403);
    }

    // Verify payment with PayMongo
    let paymentStatus = "pending";
    let paymentId = "";
    let paymentMethod = "";

    if (payment_intent_id) {
      const paymentIntent = await retrievePaymentIntent(payment_intent_id);
      paymentStatus = paymentIntent.attributes.status === "succeeded" ? "paid" : "pending";
      paymentId = paymentIntent.id;
      paymentMethod = "card";
    } else if (source_id) {
      const source = await retrieveSource(source_id);
      paymentStatus = source.attributes.status === "chargeable" ? "paid" : "pending";
      paymentId = source.id;
      paymentMethod = source.attributes.type;
    } else {
      return jsonError("Payment ID is required", 400);
    }

    // Fetch cart items
    const cartItems = await CartItem.find({
      _id: { $in: cart_item_ids },
      user_id: decoded.sub,
    }).populate("product_id");

    if (cartItems.length === 0) {
      return jsonError("No valid items found", 400);
    }

    // Group items by seller
    const ordersBySeller = new Map<
      string,
      Array<{ product: any; quantity: number; cartItemId: string }>
    >();

    for (const item of cartItems) {
      const product = item.product_id as any;
      const sellerId = product.seller_id.toString();

      if (!ordersBySeller.has(sellerId)) {
        ordersBySeller.set(sellerId, []);
      }

      ordersBySeller.get(sellerId)!.push({
        product,
        quantity: item.quantity,
        cartItemId: item._id.toString(),
      });
    }

    // Create orders for each seller
    const createdOrders = [];

    for (const [sellerId, items] of ordersBySeller) {
      const totalPrice = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
      const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);

      // Create order
      const order = await Order.create({
        buyer_id: decoded.sub,
        seller_id: sellerId,
        items: items.map((item) => ({
          product_id: item.product._id,
          quantity: item.quantity,
          price: item.product.price,
        })),
        quantity: totalQuantity,
        total_price: totalPrice,
        delivery_address,
        status: "pending",
        payment_status: paymentStatus as any,
        payment_method: paymentMethod,
        payment_intent_id: payment_intent_id || undefined,
        payment_source_id: source_id || undefined,
        paymongo_payment_id: paymentId,
      });

      createdOrders.push(order);

      // Update product quantities
      for (const item of items) {
        await Product.findByIdAndUpdate(item.product._id, {
          $inc: { quantity_available: -item.quantity },
        });
      }

      // Send notification to seller
      await Notification.create({
        user_id: sellerId,
        type: "new_order",
        title: "New Order Received",
        message: `You have received a new order with ${items.length} item(s)`,
        priority: "high",
        action_url: `/marketplace/orders/${order._id}`,
      });
    }

    // Remove items from cart
    await CartItem.deleteMany({
      _id: { $in: cart_item_ids },
    });

    return jsonOk({
      success: true,
      orders: createdOrders.map((o) => o._id),
      payment_status: paymentStatus,
      message: "Order created successfully",
    });
  } catch (error: any) {
    console.error("Confirm payment error:", error);
    return jsonError(error.message || "Failed to confirm payment", 500);
  }
}

