import { NextRequest } from "next/server";
import { connectToDatabase } from "@/server/lib/mongodb";
import { CartItem, Product } from "@/server/models/Product";
import { jsonOk, jsonError, requireMethod, getBearerToken } from "@/server/utils/api";
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
  const items = await CartItem.find({ user_id: decoded.sub }).populate({ path: "product_id", model: Product }).lean();
  return jsonOk({ items });
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
  const body = await req.json();
  const { product_id, quantity } = body || {};
  if (!product_id || !quantity || quantity < 1) return jsonError("Invalid payload", 400);
  await CartItem.updateOne(
    { user_id: decoded.sub, product_id },
    { $set: { user_id: decoded.sub, product_id, quantity } },
    { upsert: true }
  );
  return jsonOk({});
}
