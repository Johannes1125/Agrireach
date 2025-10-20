import { NextRequest } from "next/server"
import { requireMethod, jsonError, jsonOk, getAuthToken } from "@/server/utils/api"
import { verifyToken } from "@/server/utils/auth"
import { connectToDatabase } from "@/server/lib/mongodb"
import { Product } from "@/server/models/Product"
import { User } from "@/server/models/User"

export async function GET(req: NextRequest) {
  const mm = requireMethod(req, ["GET"])
  if (mm) return mm

  const token = getAuthToken(req, "access")
  if (!token) return jsonError("Unauthorized", 401)

  let decoded: any
  try {
    decoded = verifyToken<any>(token, "access")
  } catch {
    return jsonError("Unauthorized", 401)
  }

  await connectToDatabase()

  try {
    console.log("=== BUYER PRODUCTS API ===")
    console.log("User ID:", decoded.sub)
    
    // For buyers, fetch products they can purchase (not their own products)
    // For sellers/traders, fetch their own products
    const user = await User.findById(decoded.sub)
    if (!user) return jsonError("User not found", 404)
    
    const userRoles = (user as any).roles || [user.role]
    const isSeller = userRoles.includes("buyer") || userRoles.includes("seller")
    
    let products
    if (isSeller) {
      // Fetch products posted by this seller/trader
      products = await Product.find({ 
        seller_id: decoded.sub 
      })
        .sort({ created_at: -1 })
        .lean()
    } else {
      // For buyers, fetch available products (not their own)
      products = await Product.find({ 
        seller_id: { $ne: decoded.sub },
        status: "active"
      })
        .sort({ created_at: -1 })
        .limit(20)
        .lean()
    }

    console.log("Products found:", products.length)
    console.log("Sample product IDs:", products.slice(0, 3).map(p => ({ 
      _id: p._id, 
      title: p.title,
      seller_id: p.seller_id 
    })))

    const productsWithStats = products.map((product) => ({
      _id: product._id,
      title: product.title,
      category: product.category,
      price: product.price,
      unit: product.unit,
      quantity_available: product.quantity_available,
      status: product.status,
      views: product.views || 0,
      images: product.images,
      created_at: product.created_at,
      organic: product.organic,
      seller_id: product.seller_id
    }))

    return jsonOk({ products: productsWithStats })
  } catch (error: any) {
    console.error("Error fetching buyer products:", error)
    return jsonError(error.message || "Failed to fetch products", 500)
  }
}

