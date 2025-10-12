import { NextRequest } from "next/server";
import { connectToDatabase } from "@/server/lib/mongodb";
import { User } from "@/server/models/User";
import { OtpCode } from "@/server/models/OtpCode";
import { jsonOk, jsonError } from "@/server/utils/api";
import { passwordResetEmailHtml, passwordResetEmailSubject, passwordResetEmailText } from "@/server/utils/emailTemplates";
import { sendMail } from "@/server/utils/mailer";
import bcrypt from "bcryptjs";
import { z } from "zod";

const ForgotSchema = z.object({ email: z.string().email() });

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = ForgotSchema.safeParse(body);
  if (!parsed.success) return jsonError("Email required", 400);
  const { email } = parsed.data;
  await connectToDatabase();
  const user = await User.findOne({ email });
  if (!user) return jsonOk({});

  // Generate a 6-digit numeric OTP
  const token = `${Math.floor(100000 + Math.random() * 900000)}`;
  const token_hash = await bcrypt.hash(token, 10);
  const expires_at = new Date(Date.now() + 1000 * 60 * 30); // 30 minutes
  await OtpCode.create({ email, code: token_hash, type: "password_reset", expires_at, used: false });

  // Send beautiful password reset email with OTP
  const subject = passwordResetEmailSubject();
  const html = passwordResetEmailHtml({
    resetUrl: `Your verification code is: ${token}`,
    email,
    appName: "AgriReach",
    expireMinutes: 30
  });
  const text = passwordResetEmailText({
    resetUrl: `Your verification code is: ${token}`,
    appName: "AgriReach",
    expireMinutes: 30
  });

  try {
    await sendMail({ to: email, subject, html, text });
  } catch (e: any) {
    return jsonError("Failed to send reset email", 500, e?.message);
  }

  return jsonOk({ message: "Password reset code sent successfully" });
}