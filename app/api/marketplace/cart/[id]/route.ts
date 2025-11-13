import { NextRequest } from "next/server";
import { requireMethod, jsonError, jsonOk, getAuthToken } from "@/server/utils/api";
import { verifyToken } from "@/server/utils/auth";
import { validateBody } from "@/server/middleware/validate";
import { connectToDatabase } from "@/server/lib/mongodb";
import { CartItem } from "@/server/models/Product";
import { z } from "zod";

const UpdateCartItemSchema = z.object({
  quantity: z.number().min(1),
});

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const mm = requireMethod(req, ["PUT"]);
  if (mm) return mm;

  const { id } = await params;
  const token = getAuthToken(req, "access");
  if (!token) return jsonError("Unauthorized", 401);

  let decoded: any;
  try {
    decoded = verifyToken<any>(token, "access");
  } catch {
    return jsonError("Unauthorized", 401);
  }

  await connectToDatabase();
  
  // Check if user owns this cart item
  const cartItem = await CartItem.findById(id);
  if (!cartItem) return jsonError("Cart item not found", 404);
  
  if (cartItem.user_id.toString() !== decoded.sub) {
    return jsonError("Forbidden", 403);
  }

  const validate = validateBody(UpdateCartItemSchema);
  const result = await validate(req);
  if (!result.ok) return result.res;

  const updatedCartItem = await CartItem.findByIdAndUpdate(
    id,
    { $set: { quantity: result.data.quantity } },
    { new: true }
  ).populate('product_id');

  return jsonOk({ cartItem: updatedCartItem });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const mm = requireMethod(req, ["DELETE"]);
  if (mm) return mm;

  const { id } = await params;
  const token = getAuthToken(req, "access");
  if (!token) return jsonError("Unauthorized", 401);

  let decoded: any;
  try {
    decoded = verifyToken<any>(token, "access");
  } catch {
    return jsonError("Unauthorized", 401);
  }

  await connectToDatabase();
  
  // Check if user owns this cart item
  const cartItem = await CartItem.findById(id);
  if (!cartItem) return jsonError("Cart item not found", 404);
  
  if (cartItem.user_id.toString() !== decoded.sub) {
    return jsonError("Forbidden", 403);
  }

  await CartItem.findByIdAndDelete(id);

  return jsonOk({ message: "Item removed from cart" });
}
