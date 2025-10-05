import { NextRequest } from "next/server";
import { connectToDatabase } from "@/server/lib/mongodb";
import { User } from "@/server/models/User";
import { UserProfile } from "@/server/models/UserProfile";
import { jsonOk, jsonError, requireMethod, getAuthToken } from "@/server/utils/api";
import { verifyToken } from "@/server/utils/auth";

async function getAuthUserId(req: NextRequest): Promise<string | null> {
  const token = getAuthToken(req, "access");
  if (!token) return null;
  try {
    const decoded = verifyToken<any>(token, "access");
    return decoded.sub;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const mm = requireMethod(req, ["GET"]);
  if (mm) return mm;

  const userId = await getAuthUserId(req);
  if (!userId) return jsonError("Unauthorized", 401);

  await connectToDatabase();
  const [user, profile] = await Promise.all([
    User.findById(userId).lean(),
    UserProfile.findOne({ user_id: userId }).lean(),
  ]);

  if (!user) return jsonError("Not found", 404);
  return jsonOk({ user: { id: user._id, email: user.email, name: user.full_name, role: user.role, verified: user.verified, trust_score: user.trust_score }, profile });
}

export async function PUT(req: NextRequest) {
  const mm = requireMethod(req, ["PUT"]);
  if (mm) return mm;

  const userId = await getAuthUserId(req);
  if (!userId) return jsonError("Unauthorized", 401);

  const body = await req.json();
  const { name, location, bio, avatar, profile } = body || {};

  await connectToDatabase();
  const setUser: any = {};
  if (name !== undefined) setUser.name = name;
  if (location !== undefined) setUser.location = location;
  if (bio !== undefined) setUser.bio = bio;
  if (avatar !== undefined) setUser.avatar = avatar;
  if (Object.keys(setUser).length) {
    await User.findByIdAndUpdate(userId, { $set: setUser });
  }
  if (profile) {
    await UserProfile.findOneAndUpdate({ user_id: userId }, { $set: profile }, { upsert: true });
  }
  return jsonOk({});
}
