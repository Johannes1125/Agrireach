import { NextRequest } from "next/server";
import { requireMethod, jsonError, jsonOk, getAuthToken } from "@/server/utils/api";
import { verifyToken } from "@/server/utils/auth";
import { validateBody } from "@/server/middleware/validate";
import { connectToDatabase } from "@/server/lib/mongodb";
import { Order, CartItem, Product } from "@/server/models/Product";
import { Notification } from "@/server/models/Notification";
import { User } from "@/server/models/User";
import { notifyOrderPlaced } from "@/server/utils/notifications";
import { validateUserRole } from "@/server/utils/role-validation";
import { z } from "zod";

const CreateOrderSchema = z.object({
  product_id: z.string().min(1),
  quantity: z.number().min(1),
  delivery_address: z.string().min(1),
});

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

  await connectToDatabase();

  const url = new URL(req.url);
  const page = parseInt(url.searchParams.get("page") || "1", 10);
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "20", 10), 100);
  const skip = (page - 1) * limit;
  const status = url.searchParams.get("status");
  const role = url.searchParams.get("role"); // "buyer" or "seller"

  const filter: any = {};
  if (role === "seller") {
    filter.seller_id = decoded.sub;
  } else {
    filter.buyer_id = decoded.sub;
  }
  if (status) filter.status = status;

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .populate('buyer_id', 'full_name email location')
      .populate('seller_id', 'full_name email location')
      .populate('product_id', 'title price unit images')
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Order.countDocuments(filter)
  ]);

  return jsonOk({ 
    orders, 
    total, 
    page, 
    pages: Math.ceil(total / limit) 
  });
}

export async function POST(req: NextRequest) {
  const mm = requireMethod(req, ["POST"]);
  if (mm) return mm;

  // Validate user has buyer role
  let userId: string;
  try {
    const { user, userId: validatedUserId } = await validateUserRole(req, ["buyer"]);
    userId = validatedUserId;
  } catch (error: any) {
    return jsonError(error.message, 403);
  }

  const validate = validateBody(CreateOrderSchema);
  const result = await validate(req);
  if (!result.ok) return result.res;

  const { product_id, quantity, delivery_address } = result.data;

  // Check if product exists and is available
  const product = await Product.findById(product_id);
  if (!product) return jsonError("Product not found", 404);
  if (product.status !== "active") return jsonError("Product not available", 400);
  if (product.quantity_available < quantity) {
    return jsonError("Insufficient quantity available", 400);
  }

  // Check if user is trying to order their own product
  if (product.seller_id.toString() === userId) {
    return jsonError("Cannot order your own product", 400);
  }

  const totalPrice = product.price * quantity;

  // Create order
  const order = await Order.create({
    buyer_id: userId,
    seller_id: product.seller_id,
    product_id,
    quantity,
    total_price: totalPrice,
    delivery_address,
    status: "pending",
    payment_status: "pending"
  });

  // Update product quantity
  await Product.findByIdAndUpdate(product_id, {
    $inc: { quantity_available: -quantity }
  });

  // Remove from cart if exists
  await CartItem.deleteOne({ user_id: userId, product_id });

  // Send notification to seller
  await Notification.create({
    user_id: product.seller_id,
    type: 'new_order',
    title: 'New Order Received',
    message: `You have received a new order for ${product.title}`,
    priority: 'high',
    action_url: `/marketplace/orders/${order._id}`
  });

  return jsonOk({ 
    order_id: order._id,
    message: "Order created successfully"
  });
}
