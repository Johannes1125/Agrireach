import { NextRequest } from "next/server";
import { connectToDatabase } from "@/server/lib/mongodb";
import { User } from "@/server/models/User";
import { OtpCode } from "@/server/models/OtpCode";
import { jsonOk, jsonError } from "@/server/utils/api";
import bcrypt from "bcryptjs";
import { z } from "zod";

const VerifyResetCodeSchema = z.object({ 
  email: z.string().email(), 
  token: z.string().length(6).regex(/^\d{6}$/) 
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = VerifyResetCodeSchema.safeParse(body);
  if (!parsed.success) return jsonError("Invalid payload", 400);
  const { email, token } = parsed.data;
  
  await connectToDatabase();
  const user = await User.findOne({ email });
  if (!user) return jsonError("Invalid email", 400);

  const records = await OtpCode.find({ email, type: "password_reset", used: false }).sort({ created_at: -1 }).limit(5).lean();
  if (records.length === 0) return jsonError("Invalid or expired code", 400);
  
  let valid = false;
  for (const rec of records) {
    const match = await bcrypt.compare(token, rec.code);
    if (match && rec.expires_at > new Date()) {
      valid = true;
      break;
    }
  }
  
  if (!valid) return jsonError("Invalid or expired code", 400);
  
  return jsonOk({ message: "Code verified successfully" });
}
