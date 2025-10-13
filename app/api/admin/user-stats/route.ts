import { NextRequest } from "next/server";
import { requireMethod, jsonError, jsonOk, getAuthToken } from "@/server/utils/api";
import { verifyToken } from "@/server/utils/auth";
import { connectToDatabase } from "@/server/lib/mongodb";
import { User } from "@/server/models/User";

export interface AdminUserStats {
  totalUsers: number;
  activeUsers: number;
  suspendedUsers: number;
  bannedUsers: number;
  pendingReviewUsers: number;
  generated_at: string;
}

export async function GET(req: NextRequest) {
  console.log("Admin user-stats API called");
  const mm = requireMethod(req, ["GET"]);
  if (mm) return mm;

  const token = getAuthToken(req, "access");
  if (!token) {
    console.log("No token found");
    return jsonError("Unauthorized", 401);
  }
  
  let decoded: any;
  try {
    decoded = verifyToken<any>(token, "access");
    console.log("Token decoded successfully, role:", decoded.role);
  } catch (error) {
    console.log("Token verification failed:", error);
    return jsonError("Unauthorized", 401);
  }
  
  if (decoded.role !== "admin") {
    console.log("User is not admin, role:", decoded.role);
    return jsonError("Forbidden", 403);
  }

  console.log("Admin authentication successful, connecting to database...");
  await connectToDatabase();

  try {
    // Get user statistics
    const [
      totalUsers,
      activeUsers,
      suspendedUsers,
      bannedUsers,
      unverifiedUsers
    ] = await Promise.all([
      User.countDocuments({}),
      User.countDocuments({ status: "active" }),
      User.countDocuments({ status: "suspended" }),
      User.countDocuments({ status: "banned" }),
      User.countDocuments({ verified: false })
    ]);

    const stats: AdminUserStats = {
      totalUsers,
      activeUsers,
      suspendedUsers,
      bannedUsers,
      pendingReviewUsers: unverifiedUsers, // Using unverified users as "pending review"
      generated_at: new Date().toISOString()
    };

    console.log("Admin User Stats:", stats);
    return jsonOk(stats);
  } catch (error) {
    console.error("Error fetching admin user stats:", error);
    return jsonError("Failed to fetch user statistics", 500);
  }
}
