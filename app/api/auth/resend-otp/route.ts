import { NextRequest } from "next/server";
import { requireMethod, jsonError, jsonOk } from "@/server/utils/api";
import { validateBody } from "@/server/middleware/validate";
import { connectToDatabase } from "@/server/lib/mongodb";
import { OtpCode } from "@/server/models/OtpCode";
import { verificationOtpEmailHtml, verificationOtpEmailSubject, verificationOtpEmailText } from "@/server/utils/emailTemplates";
import { sendMail } from "@/server/utils/mailer";
import bcrypt from "bcryptjs";
import { z } from "zod";

const ResendOTPSchema = z.object({
  email: z.string().email(),
  type: z.enum(["registration", "password_reset"]),
});

export async function POST(req: NextRequest) {
  const mm = requireMethod(req, ["POST"]);
  if (mm) return mm;

  const validate = validateBody(ResendOTPSchema);
  const result = await validate(req);
  if (!result.ok) return result.res;

  const { email, type } = result.data;

  await connectToDatabase();

  // Check rate limiting - max 3 codes per 15 minutes
  const recentCodes = await OtpCode.countDocuments({
    email,
    type,
    created_at: { $gte: new Date(Date.now() - 15 * 60 * 1000) }
  });

  if (recentCodes >= 3) {
    return jsonError("Too many requests. Please wait 15 minutes.", 429);
  }

  // Generate new OTP
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const hashedCode = await bcrypt.hash(code, 10);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  await OtpCode.create({
    email,
    code: hashedCode,
    type,
    expires_at: expiresAt,
  });

  // Send beautiful email
  const subject = verificationOtpEmailSubject();
  const html = verificationOtpEmailHtml({
    code,
    email,
    appName: "AgriReach",
    expireMinutes: 10
  });
  const text = verificationOtpEmailText({
    code,
    appName: "AgriReach",
    expireMinutes: 10
  });

  await sendMail({
    to: email,
    subject,
    html,
    text,
  });

  return jsonOk({ message: "OTP sent successfully" });
}
