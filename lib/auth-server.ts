import { cookies } from "next/headers";
import { verifyToken } from "@/server/utils/auth";
import { connectToDatabase } from "@/server/lib/mongodb";
import { User } from "@/server/models/User";

export async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("agrireach_at")?.value;
    
    if (!accessToken) {
      return null;
    }

    const decoded = verifyToken<any>(accessToken, "access");
    if (!decoded?.sub) {
      return null;
    }

    await connectToDatabase();
    const user = await User.findById(decoded.sub).select("-password_hash").lean();
    
    if (!user) {
      return null;
    }

    return {
      id: user._id.toString(),
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      avatar_url: user.avatar_url,
      location: user.location,
      verified: user.verified,
      trust_score: user.trust_score,
      status: user.status,
      created_at: user.created_at,
    };
  } catch (error) {
    console.error("Auth error:", error);
    return null;
  }
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Authentication required");
  }
  return user;
}
