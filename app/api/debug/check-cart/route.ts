import { NextRequest } from "next/server";
import { connectToDatabase } from "@/server/lib/mongodb";
import { CartItem, Product } from "@/server/models/Product";
import { User } from "@/server/models/User";
import { jsonOk, jsonError, getAuthToken } from "@/server/utils/api";
import { verifyToken } from "@/server/utils/auth";

export async function GET(req: NextRequest) {
  const token = getAuthToken(req, "access");
  if (!token) return jsonError("Unauthorized", 401);

  let decoded: any;
  try {
    decoded = verifyToken<any>(token, "access");
  } catch {
    return jsonError("Unauthorized", 401);
  }

  await connectToDatabase();

  console.log("\n=== CART DEBUG ===");
  console.log("Current user ID:", decoded.sub);

  // Check if user exists
  const user = await User.findById(decoded.sub);
  console.log("User exists:", !!user);
  if (user) {
    console.log("User name:", user.full_name);
  }

  // Get raw cart items (no populate)
  const rawCartItems = await CartItem.find({ user_id: decoded.sub }).lean();
  console.log("\nRaw cart items found:", rawCartItems.length);
  rawCartItems.forEach((item, idx) => {
    console.log(`Cart item ${idx + 1}:`, {
      _id: item._id,
      user_id: item.user_id,
      product_id: item.product_id,
      quantity: item.quantity
    });
  });

  // Check if products exist
  for (const cartItem of rawCartItems) {
    const product = await Product.findById(cartItem.product_id);
    console.log(`\nProduct ${cartItem.product_id}:`, {
      exists: !!product,
      title: product?.title,
      status: product?.status,
      seller_id: product?.seller_id
    });
  }

  // Get populated cart items
  const populatedCartItems = await CartItem.find({ user_id: decoded.sub })
    .populate({
      path: 'product_id',
      populate: {
        path: 'seller_id',
        select: 'full_name location'
      }
    })
    .lean();

  console.log("\nPopulated cart items:", populatedCartItems.length);
  populatedCartItems.forEach((item: any, idx) => {
    console.log(`Populated item ${idx + 1}:`, {
      _id: item._id,
      product_id: item.product_id ? {
        _id: item.product_id._id,
        title: item.product_id.title,
        price: item.product_id.price
      } : null,
      quantity: item.quantity
    });
  });

  console.log("=== END DEBUG ===\n");

  return jsonOk({
    message: "Check server console for debug info",
    raw_count: rawCartItems.length,
    populated_count: populatedCartItems.length
  });
}

