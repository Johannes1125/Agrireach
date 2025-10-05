import { NextRequest } from "next/server";
import { requireMethod, jsonError, jsonOk, getAuthToken } from "@/server/utils/api";
import { verifyToken } from "@/server/utils/auth";
import { validateBody } from "@/server/middleware/validate";
import { connectToDatabase } from "@/server/lib/mongodb";
import { Product } from "@/server/models/Product";
import { z } from "zod";

const UpdateProductSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  price: z.number().positive().optional(),
  unit: z.string().optional(),
  quantity_available: z.number().min(0).optional(),
  location: z.string().optional(),
  images: z.any().optional(),
  organic: z.boolean().optional(),
  status: z.enum(["active", "sold", "pending_approval"]).optional(),
});

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const mm = requireMethod(req, ["GET"]);
  if (mm) return mm;

  await connectToDatabase();
  const { id } = await params;
  
  // Increment view count
  const product = await Product.findByIdAndUpdate(
    id,
    { $inc: { views: 1 } },
    { new: true }
  ).populate('seller_id', 'full_name email location').lean();

  if (!product) return jsonError("Product not found", 404);

  return jsonOk({ product });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const mm = requireMethod(req, ["PUT"]);
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
  const { id } = await params;
  
  // Check if user owns this product
  const product = await Product.findById(id);
  if (!product) return jsonError("Product not found", 404);
  
  if (product.seller_id.toString() !== decoded.sub) {
    return jsonError("Forbidden", 403);
  }

  const validate = validateBody(UpdateProductSchema);
  const result = await validate(req);
  if (!result.ok) return result.res;

  const updatedProduct = await Product.findByIdAndUpdate(
    id,
    { $set: result.data },
    { new: true }
  ).populate('seller_id', 'full_name email location');

  return jsonOk({ product: updatedProduct });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const mm = requireMethod(req, ["DELETE"]);
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
  const { id } = await params;
  
  // Check if user owns this product
  const product = await Product.findById(id);
  if (!product) return jsonError("Product not found", 404);
  
  if (product.seller_id.toString() !== decoded.sub) {
    return jsonError("Forbidden", 403);
  }

  await Product.findByIdAndDelete(id);

  return jsonOk({ message: "Product deleted successfully" });
}
