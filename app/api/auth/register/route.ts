import { NextRequest } from "next/server";
import { requireMethod, jsonError } from "@/server/utils/api";
import { validateBody } from "@/server/middleware/validate";
import { RegisterSchema } from "@/server/validators/authSchemas";
import { AuthController } from "@/server/controllers/authController";
import { OtpCode } from "@/server/models/OtpCode";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/server/lib/mongodb";
import { User } from "@/server/models/User";

export async function POST(req: NextRequest) {
  const mm = requireMethod(req, ["POST"]);
  if (mm) return mm;
  const validate = validateBody(RegisterSchema);
  const result = await validate(req);
  if (!result.ok) return result.res;
  const { email, token } = result.data;

  await connectToDatabase();
  const exists = await User.findOne({ email });
  if (exists) return jsonError("Email already registered", 409);

  const records = await OtpCode.find({ email, type: "registration", used: false }).sort({ created_at: -1 }).limit(5).lean();
  if (records.length === 0) return jsonError("Invalid or expired code", 400);
  let ok = false;
  for (const rec of records) {
    const match = await bcrypt.compare(token, rec.code);
    if (match && rec.expires_at > new Date()) { ok = true; break; }
  }
  if (!ok) return jsonError("Invalid or expired code", 400);

  // consume codes
  await OtpCode.updateMany({ email, type: "registration" }, { $set: { used: true } });
  
  // Extract only the fields needed for registration (exclude token)
  const { token: _, ...registrationData } = result.data;
  return AuthController.register(req, registrationData);
}
