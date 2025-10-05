import { NextRequest } from "next/server";
import { requireMethod, jsonError, jsonOk, getAuthToken } from "@/server/utils/api";
import { verifyToken } from "@/server/utils/auth";
import { validateBody } from "@/server/middleware/validate";
import { connectToDatabase } from "@/server/lib/mongodb";
import { Product } from "@/server/models/Product";
import { z } from "zod";

const CreateProductSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  category: z.string().min(1),
  price: z.number().positive(),
  unit: z.string().min(1),
  quantity_available: z.number().min(0),
  location: z.string().min(1),
  images: z.any().optional(),
  organic: z.boolean().default(false),
});

export async function GET(req: NextRequest) {
  const mm = requireMethod(req, ["GET"]);
  if (mm) return mm;

  await connectToDatabase();

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q");
  const search = searchParams.get("search");
  const category = searchParams.get("category");
  const location = searchParams.get("location");
  const organic = searchParams.get("organic");
  const status = searchParams.get("status") || "active";
  const minPrice = searchParams.get("minPrice");
  const maxPrice = searchParams.get("maxPrice");
  const sortBy = searchParams.get("sortBy");
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10), 100);
  const skip = (page - 1) * limit;

  const filter: any = { status };
  if (category) filter.category = category;
  if (location) filter.location = { $regex: location, $options: "i" };
  if (organic === "true") filter.organic = true;
  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = parseFloat(minPrice);
    if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
  }
  if (q) filter.$text = { $search: q };
  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } }
    ];
  }

  // Sorting
  let sort: any = { created_at: -1 }; // default: newest first

  switch (sortBy) {
    case "price-low":
      sort = { price: 1 };
      break;
    case "price-high":
      sort = { price: -1 };
      break;
    case "name":
      sort = { title: 1 };
      break;
    case "oldest":
      sort = { created_at: 1 };
      break;
    default:
      sort = { created_at: -1 };
  }

  const [products, total] = await Promise.all([
    Product.find(filter)
      .populate('seller_id', 'full_name location verified trust_score')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    Product.countDocuments(filter)
  ]);

  return jsonOk({ 
    products, 
    total, 
    page, 
    pages: Math.ceil(total / limit) 
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

  const validate = validateBody(CreateProductSchema);
  const result = await validate(req);
  if (!result.ok) return result.res;

  await connectToDatabase();
  
  const product = await Product.create({
    ...result.data,
    seller_id: decoded.sub,
    status: "pending_approval" // All products need approval
  });

  return jsonOk({ 
    id: product._id,
    message: "Product created successfully and is pending approval"
  });
}
