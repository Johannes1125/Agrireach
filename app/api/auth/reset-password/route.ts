import { NextRequest } from "next/server";
import { connectToDatabase } from "@/server/lib/mongodb";
import { User } from "@/server/models/User";
import { PasswordResetToken } from "@/server/models/AuthToken";
import { jsonOk, jsonError } from "@/server/utils/api";
import { hashPassword } from "@/server/utils/auth";
import bcrypt from "bcryptjs";
import { z } from "zod";

const ResetSchema = z.object({ email: z.string().email(), token: z.string().min(10), new_password: z.string().min(8) });

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = ResetSchema.safeParse(body);
  if (!parsed.success) return jsonError("Invalid payload", 400);
  const { email, token, new_password } = parsed.data;
  await connectToDatabase();
  const user = await User.findOne({ email });
  if (!user) return jsonError("Invalid token", 400);

  const records = await PasswordResetToken.find({ user_id: user._id }).sort({ created_at: -1 }).limit(5).lean();
  if (records.length === 0) return jsonError("Invalid token", 400);

  for (const rec of records) {
    const ok = await bcrypt.compare(token, rec.token_hash);
    if (ok && rec.expires_at > new Date()) {
      user.password_hash = await hashPassword(new_password);
      await user.save();
      await PasswordResetToken.deleteMany({ user_id: user._id });
      return jsonOk({});
    }
  }
  return jsonError("Invalid or expired token", 400);
}
