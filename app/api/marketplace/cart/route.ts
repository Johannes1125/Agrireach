import { NextRequest } from "next/server";
import { requireMethod, jsonError, jsonOk, getAuthToken } from "@/server/utils/api";
import { verifyToken } from "@/server/utils/auth";
import { validateBody } from "@/server/middleware/validate";
import { connectToDatabase } from "@/server/lib/mongodb";
import { CartItem, Product } from "@/server/models/Product";
import { z } from "zod";

const AddToCartSchema = z.object({
  product_id: z.string().min(1),
  quantity: z.number().min(1),
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
  
  console.log("Fetching cart for user_id:", decoded.sub);
  
  const cartItems = await CartItem.find({ user_id: decoded.sub })
    .populate({
      path: 'product_id',
      populate: {
        path: 'seller_id',
        select: 'full_name location'
      }
    })
    .lean();

  console.log("Cart items found (before filtering):", cartItems.length);

  // Filter out items where product_id is null (deleted products)
  const validCartItems = cartItems.filter((item: any) => item.product_id !== null);
  
  console.log("Valid cart items (after filtering):", validCartItems.length);

  // If any items had null products, delete them from database
  const invalidItems = cartItems.filter((item: any) => item.product_id === null);
  if (invalidItems.length > 0) {
    console.log("Removing invalid cart items:", invalidItems.length);
    const invalidIds = invalidItems.map((item: any) => item._id);
    await CartItem.deleteMany({ _id: { $in: invalidIds } });
  }

  // Calculate totals
  const totalItems = validCartItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = validCartItems.reduce((sum, item: any) => {
    return sum + (item.product_id.price * item.quantity);
  }, 0);

  return jsonOk({ 
    items: validCartItems,
    summary: {
      totalItems,
      totalPrice: Math.round(totalPrice * 100) / 100
    }
  });
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

  const validate = validateBody(AddToCartSchema);
  const result = await validate(req);
  if (!result.ok) return result.res;

  const { product_id, quantity } = result.data;

  await connectToDatabase();

  // Check if product exists and is available
  const product = await Product.findById(product_id);
  if (!product) return jsonError("Product not found", 404);
  if (product.status !== "active") return jsonError("Product not available", 400);
  if (product.quantity_available < quantity) {
    return jsonError("Insufficient quantity available", 400);
  }

  // Check if user is trying to add their own product
  if (product.seller_id.toString() === decoded.sub) {
    return jsonError("Cannot add your own product to cart", 400);
  }

  // Add or update cart item
  const cartItem = await CartItem.findOneAndUpdate(
    { user_id: decoded.sub, product_id },
    { 
      $set: { user_id: decoded.sub, product_id },
      $inc: { quantity }
    },
    { upsert: true, new: true }
  ).populate('product_id');

  return jsonOk({ 
    cartItem,
    message: "Item added to cart successfully"
  });
}
