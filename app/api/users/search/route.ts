import { NextRequest } from "next/server";
import { connectToDatabase } from "@/server/lib/mongodb";
import { User } from "@/server/models/User";
import { jsonOk, requireMethod } from "@/server/utils/api";

export async function GET(req: NextRequest) {
  const mm = requireMethod(req, ["GET"]);
  if (mm) return mm;
  const q = (new URL(req.url).searchParams.get("q") || "").trim();
  await connectToDatabase();
  let users;
  if (!q) {
    users = await User.find().limit(20).lean();
  } else {
    users = await User.find({ $or: [ { full_name: { $regex: q, $options: "i" } }, { email: { $regex: q, $options: "i" } } ] }).limit(20).lean();
  }
  return jsonOk({ users: users.map(u => ({ id: u._id, name: u.full_name, email: u.email, role: u.role, avatar: u.avatar_url })) });
}


