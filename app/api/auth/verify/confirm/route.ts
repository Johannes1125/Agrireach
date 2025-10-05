import { NextRequest } from "next/server";
import { connectToDatabase } from "@/server/lib/mongodb";
import { User } from "@/server/models/User";
import { OtpCode } from "@/server/models/OtpCode";
import { jsonOk, jsonError } from "@/server/utils/api";
import bcrypt from "bcryptjs";
import { z } from "zod";

const VerifyConfirmSchema = z.object({ email: z.string().email(), token: z.string().length(6).regex(/^\d{6}$/) });

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = VerifyConfirmSchema.safeParse(body);
  if (!parsed.success) return jsonError("Invalid payload", 400);
  const { email, token } = parsed.data;
  await connectToDatabase();
  const user = await User.findOne({ email });
  if (!user) return jsonError("Invalid token", 400);
  if (user.verified) return jsonOk({});

  const records = await OtpCode.find({ email, type: "registration", used: false }).sort({ created_at: -1 }).limit(5).lean();
  if (records.length === 0) return jsonError("Invalid token", 400);
  for (const rec of records) {
    const ok = await bcrypt.compare(token, rec.token_hash);
    if (ok && rec.expires_at > new Date()) {
      user.verified = true;
      await user.save();
      await OtpCode.updateMany({ email, type: "registration" }, { $set: { used: true } });
      return jsonOk({});
    }
  }
  return jsonError("Invalid or expired token", 400);
}
