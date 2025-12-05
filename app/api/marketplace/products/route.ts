import { NextRequest } from "next/server";
import { requireMethod, jsonError, jsonOk, getAuthToken } from "@/server/utils/api";
import { verifyToken } from "@/server/utils/auth";
import { validateBody } from "@/server/middleware/validate";
import { connectToDatabase } from "@/server/lib/mongodb";
import { Product } from "@/server/models/Product";
import { User } from "@/server/models/User";
import { notifyAllUsersNewProduct } from "@/server/utils/notifications";
import { validateUserRole } from "@/server/utils/role-validation";
import { isNearby } from "@/server/utils/location-filter";
import { determineShippingZone } from "@/server/utils/shipping-calculator";
import { z } from "zod";
import { Types } from "mongoose";

// Priority map to order products from nearest to farthest
const ZONE_PRIORITY: Record<string, number> = {
  direct: 0,
  same_city: 1,
  same_province: 2,
  metro_manila: 3,
  central_luzon: 4,
  other_luzon: 5,
  visayas: 6,
  mindanao: 7,
  default: 99,
};

const sortByProximity = (items: any[], buyerLocation?: string) => {
  if (!buyerLocation) return items;

  return items
    .map((product) => {
      const sellerLocation = product.seller_id?.location || product.location || "";
      const zone = determineShippingZone(sellerLocation, buyerLocation);
      return { product, zone };
    })
    .sort((a, b) => {
      const pa = ZONE_PRIORITY[a.zone] ?? ZONE_PRIORITY.default;
      const pb = ZONE_PRIORITY[b.zone] ?? ZONE_PRIORITY.default;
      if (pa !== pb) return pa - pb;
      // Tie-breaker: newest first
      return new Date(b.product.created_at).getTime() - new Date(a.product.created_at).getTime();
    })
    .map(({ product }) => product);
};

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
  const status = searchParams.get("status");
  const minPrice = searchParams.get("minPrice");
  const maxPrice = searchParams.get("maxPrice");
  const sortBy = searchParams.get("sortBy");
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10), 100);
  const skip = (page - 1) * limit;
  
  // New filters for hiding own products and near me
  const excludeOwn = searchParams.get("excludeOwn") === "true";
  const nearMe = searchParams.get("nearMe") === "true";
  const buyerLocation = searchParams.get("buyerLocation");

  const filter: any = {};
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

  // Visibility: All users see active products. Sellers also see their own products regardless of status.
  let decoded: any | null = null;
  const token = getAuthToken(req, "access");
  if (token) {
    try {
      decoded = verifyToken<any>(token, "access");
    } catch {
      decoded = null;
    }
  }

  const userObjectId = decoded?.sub && Types.ObjectId.isValid(decoded.sub)
    ? new Types.ObjectId(decoded.sub)
    : decoded?.sub;

  // If status filter is explicitly provided (e.g., admin filtering), use it
  // Otherwise: show active products to everyone, plus seller's own products (any status)
  const { $or: searchOr, ...restFilter } = filter; // extract search OR to avoid overwriting
  let finalFilter: any = { ...restFilter };

  if (!status) {
    if (userObjectId) {
      if (excludeOwn) {
        // Exclude user's own products from the listing
        finalFilter.status = "active";
        finalFilter.seller_id = { $ne: userObjectId };
      } else {
        // Include user's own products regardless of status
        const visibilityOr = [{ status: "active" }, { seller_id: userObjectId }];
        if (searchOr) {
          finalFilter.$and = [{ $or: searchOr }, { $or: visibilityOr }];
        } else {
          finalFilter.$or = visibilityOr;
        }
      }
    } else {
      finalFilter.status = "active";
    }
  } else {
    finalFilter.status = status;
  }

  // Re-apply search OR when it wasn't combined above
  if (searchOr && !(finalFilter.$and || finalFilter.$or)) {
    finalFilter.$or = searchOr;
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

  // If nearMe is active, fetch a larger window and paginate after proximity sort
  const fetchLimit = nearMe && buyerLocation ? 500 : limit;
  
  let [products, total] = await Promise.all([
    Product.find(finalFilter)
      .populate('seller_id', 'full_name location verified trust_score')
      .sort(sort)
      .skip(nearMe && buyerLocation ? 0 : skip) // Skip handled after proximity sorting for nearMe
      .limit(fetchLimit) // Fetch more only when nearMe sorting is applied
      .lean(),
    Product.countDocuments(finalFilter)
  ]);
  const totalUnfiltered = total; // keep original count for consistent pagination metadata
  let filteredTotal = total;     // may change when nearMe filter applies

  // Apply "near me" filter if requested
  if (nearMe && buyerLocation) {
    products = products.filter((product: any) => {
      const sellerLocation = product.seller_id?.location || product.location;
      return isNearby(sellerLocation, buyerLocation);
    });
    products = sortByProximity(products, buyerLocation);
    filteredTotal = products.length;
    
    // Apply pagination after nearMe filter
    products = products.slice(skip, skip + limit);
  } else if (buyerLocation) {
    // Keep requested sort order; no proximity override when nearMe is false
  }

  return jsonOk({ 
    products, 
    total: nearMe && buyerLocation ? filteredTotal : totalUnfiltered,
    filteredTotal,
    page, 
    pages: Math.ceil((nearMe && buyerLocation ? filteredTotal : totalUnfiltered) / limit) 
  });
}

export async function POST(req: NextRequest) {
  const mm = requireMethod(req, ["POST"]);
  if (mm) return mm;

  // Validate user has buyer role (buyers can sell products too)
  let userId: string;
  try {
    const { user, userId: validatedUserId } = await validateUserRole(req, ["buyer"]);
    userId = validatedUserId;
  } catch (error: any) {
    return jsonError(error.message, 403);
  }

  const validate = validateBody(CreateProductSchema);
  const result = await validate(req);
  if (!result.ok) return result.res;
  
  const product = await Product.create({
    ...result.data,
    seller_id: userId,
    status: "active"
  });

  // Get seller info for notification
  const seller = await User.findById(userId).select("full_name").lean();
  const sellerName = seller?.full_name || "A seller";
  
  // Notify all users about new product listing (don't await to avoid slowing down the response)
  notifyAllUsersNewProduct(result.data.title, sellerName, String(product._id)).catch(err => 
    console.error("Failed to send product notifications:", err)
  );

  return jsonOk({ 
    id: product._id,
    message: "Product created successfully and is pending approval"
  });
}