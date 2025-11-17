import { NextRequest } from "next/server";
import { requireMethod, jsonOk, jsonError } from "@/server/utils/api";
import { connectToDatabase } from "@/server/lib/mongodb";
import { User } from "@/server/models/User";
import { UserProfile } from "@/server/models/UserProfile";
import { Review } from "@/server/models/Review";
import { Product } from "@/server/models/Product";

export async function GET(req: NextRequest) {
  const mm = requireMethod(req, ["GET"]);
  if (mm) return mm;

  try {
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10), 100);
    const skip = (page - 1) * limit;
    const search = searchParams.get("search") || "";
    const location = searchParams.get("location") || "";
    const category = searchParams.get("category") || "";

    // First, get ALL users who have products or business profiles
    // This way we don't miss any producers regardless of their role
    
    // Get users with business profiles
    const usersWithProfiles = await UserProfile.find({})
      .select("user_id company_name business_address services_offered industry business_logo")
      .lean();

    const userIdsWithProfiles = usersWithProfiles.map((p: any) => p.user_id.toString());

    // Also get users who have products (even without profile)
    const usersWithProducts = await Product.distinct("seller_id");
    const userIdsWithProducts = usersWithProducts.map((id: any) => id.toString());

    // Combine unique user IDs
    const allProducerIds = Array.from(new Set([...userIdsWithProfiles, ...userIdsWithProducts]));

    if (allProducerIds.length === 0) {
      return jsonOk({
        items: [],
        total: 0,
        page: 1,
        pages: 0,
      });
    }

    // NOW build filter - only require active status, not specific roles
    // This ensures all users with products/profiles are included
    const userFilter: any = {
      _id: { $in: allProducerIds },
      status: "active", // Only require active status, not specific roles
    };

    // Apply search filter
    if (search) {
      userFilter.$or = [
        { full_name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    // Fetch users
    const users = await User.find(userFilter)
      .select("_id full_name email avatar_url location verified trust_score verification_status roles")
      .skip(skip)
      .limit(limit)
      .lean();

    // Get profiles for these users
    const userIds = users.map((u: any) => u._id);
    const profiles = await UserProfile.find({ user_id: { $in: userIds } }).lean();
    const profileMap = new Map(profiles.map((p: any) => [p.user_id.toString(), p]));

    // Get ratings for these users
    const reviews = await Review.aggregate([
      {
        $match: {
          reviewee_id: { $in: userIds },
          status: "active",
        },
      },
      {
        $group: {
          _id: "$reviewee_id",
          averageRating: { $avg: "$rating" },
          totalReviews: { $sum: 1 },
        },
      },
    ]);

    const ratingMap = new Map(
      reviews.map((r: any) => [
        String(r._id),
        {
          rating: Math.round((r.averageRating || 0) * 10) / 10,
          reviewsCount: r.totalReviews,
        },
      ])
    );

    // Get product counts
    const productCounts = await Product.aggregate([
      {
        $match: {
          seller_id: { $in: userIds },
          status: "active",
        },
      },
      {
        $group: {
          _id: "$seller_id",
          count: { $sum: 1 },
          categories: { $addToSet: "$category" },
        },
      },
    ]);

    const productMap = new Map(
      productCounts.map((p: any) => [
        String(p._id),
        {
          count: p.count,
          categories: p.categories || [],
        },
      ])
    );

    // Format producers
    const producers = users
      .map((user: any) => {
        const profile = profileMap.get(String(user._id));
        const ratingData = ratingMap.get(String(user._id)) || { rating: 0, reviewsCount: 0 };
        const productData = productMap.get(String(user._id)) || { count: 0, categories: [] };

        // Determine category from services_offered or product categories
        const services = profile?.services_offered || [];
        const productCategories = productData.categories || [];
        const allCategories = [...services, ...productCategories];
        const primaryCategory = allCategories[0] || profile?.industry || "General";

        // Determine location
        const locationValue = profile?.business_address || user.location || "Not specified";

        // Apply location filter
        if (location && location !== "all") {
          if (!locationValue.toLowerCase().includes(location.toLowerCase())) {
            return null;
          }
        }

        // Apply category filter
        if (category && category !== "all") {
          if (!allCategories.some((c: string) => c.toLowerCase().includes(category.toLowerCase()))) {
            return null;
          }
        }

        // Featured status: verified users with high trust score or high ratings
        const isFeatured = user.verified || user.trust_score >= 80 || ratingData.rating >= 4.5;

        return {
          id: String(user._id),
          name: profile?.company_name || user.full_name,
          location: locationValue,
          description: profile?.business_description || user.bio || `${user.full_name} is a producer on AgriReach.`,
          category: primaryCategory,
          rating: ratingData.rating || 0,
          reviewsCount: ratingData.reviewsCount,
          featured: isFeatured,
          avatar: user.avatar_url || profile?.business_logo || null,
          verified: user.verified || user.verification_status === "verified",
          trustScore: user.trust_score || 0,
          userId: String(user._id),
          productsCount: productData.count,
          services: services,
          industry: profile?.industry,
          website: profile?.website,
          phone: profile?.phone || user.phone,
        };
      })
      .filter((p: any) => p !== null);

    // Get total count for pagination (after filtering)
    const totalUsers = await User.countDocuments(userFilter);
    const total = producers.length; // This is after location/category filtering

    return jsonOk({
      items: producers,
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (error: any) {
    console.error("Error fetching producers:", error);
    return jsonError(error.message || "Failed to fetch producers", 500);
  }
}

