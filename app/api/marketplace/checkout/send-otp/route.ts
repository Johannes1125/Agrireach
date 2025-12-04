import { NextRequest } from "next/server";
import { connectToDatabase } from "@/server/lib/mongodb";
import { OtpCode } from "@/server/models/OtpCode";
import { requireMethod, jsonOk, jsonError, getAuthToken } from "@/server/utils/api";
import { verifyToken } from "@/server/utils/auth";
import { checkoutOtpEmailHtml, checkoutOtpEmailSubject, checkoutOtpEmailText } from "@/server/utils/emailTemplates";
import { sendMail } from "@/server/utils/mailer";
import bcrypt from "bcryptjs";
import { z } from "zod";

const SendOtpSchema = z.object({
  email: z.string().email(),
  amount: z.number().positive(),
});

export async function POST(req: NextRequest) {
  const mm = requireMethod(req, ["POST"]);
  if (mm) return mm;

  // Verify user is authenticated
  const token = getAuthToken(req, "access");
  if (!token) return jsonError("Unauthorized", 401);

  try {
    verifyToken<any>(token, "access");
  } catch {
    return jsonError("Unauthorized", 401);
  }

  try {

    const body = await req.json();
    const parsed = SendOtpSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError("Invalid request data", 400);
    }

    const { email, amount } = parsed.data;
    
    await connectToDatabase();

    // Rate limiting - max 3 codes per 15 minutes
    const recentCodes = await OtpCode.countDocuments({
      email,
      type: "checkout",
      created_at: { $gte: new Date(Date.now() - 15 * 60 * 1000) }
    });

    if (recentCodes >= 3) {
      return jsonError("Too many requests. Please wait 15 minutes before requesting a new code.", 429);
    }

    // Generate 6-digit OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedCode = await bcrypt.hash(code, 10);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store OTP
    await OtpCode.create({
      email,
      code: hashedCode,
      type: "checkout",
      expires_at: expiresAt,
      used: false,
    });

    // Send email
    const subject = checkoutOtpEmailSubject();
    const html = checkoutOtpEmailHtml({
      code,
      amount,
      email,
      appName: "AgriReach",
      expireMinutes: 10
    });
    const text = checkoutOtpEmailText({
      code,
      amount,
      appName: "AgriReach",
      expireMinutes: 10
    });

    await sendMail({
      to: email,
      subject,
      html,
      text,
    });

    return jsonOk({ 
      message: "Verification code sent successfully",
      expiresAt: expiresAt.toISOString()
    });
  } catch (error: any) {
    console.error("Send checkout OTP error:", error);
    return jsonError("Failed to send verification code", 500, error?.message);
  }
}

