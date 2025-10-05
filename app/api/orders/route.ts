import { NextRequest } from "next/server";
import { connectToDatabase } from "@/server/lib/mongodb";
import { CartItem, Order, Product, OrderItem } from "@/server/models/Product";
import { jsonOk, jsonError, getBearerToken } from "@/server/utils/api";
import { verifyToken } from "@/server/utils/auth";

export async function GET(req: NextRequest) {
  const token = getBearerToken(req);
  if (!token) return jsonError("Unauthorized", 401);
  let decoded: any;
  try {
    decoded = verifyToken<any>(token, "access");
  } catch {
    return jsonError("Unauthorized", 401);
  }
  await connectToDatabase();
  const orders = await Order.find({ buyer_id: decoded.sub }).sort({ created_at: -1 }).lean();
  return jsonOk({ items: orders });
}

export async function POST(req: NextRequest) {
  const token = getBearerToken(req);
  if (!token) return jsonError("Unauthorized", 401);
  let decoded: any;
  try {
    decoded = verifyToken<any>(token, "access");
  } catch {
    return jsonError("Unauthorized", 401);
  }
  await connectToDatabase();

  const cart = await CartItem.find({ user_id: decoded.sub }).populate({ path: "product_id", model: Product }).lean();
  if (cart.length === 0) return jsonError("Cart is empty", 400);

  const orderItemsData = cart.map((ci) => ({
    order_id: undefined as any, // set after Order is created if needed per doc model
    product_id: (ci.product_id as any)._id,
    quantity: ci.quantity,
    unit_price: (ci.product_id as any).price,
    subtotal: (ci.product_id as any).price * ci.quantity,
  }));

  const total_amount = orderItemsData.reduce((sum, i) => sum + i.subtotal, 0);
  const seller_id = (cart[0].product_id as any).seller_id;

  const order = await Order.create({ buyer_id: decoded.sub, seller_id, total_amount, status: "pending" });

  await Promise.all(
    orderItemsData.map((oi) => OrderItem.create({ ...oi, order_id: order._id }))
  );

  await CartItem.deleteMany({ user_id: decoded.sub });

  return jsonOk({ id: order._id });
}
