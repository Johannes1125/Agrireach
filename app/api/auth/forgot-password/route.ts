import { NextRequest } from "next/server";
import { connectToDatabase } from "@/server/lib/mongodb";
import { User } from "@/server/models/User";
import { PasswordResetToken } from "@/server/models/AuthToken";
import { jsonOk, jsonError } from "@/server/utils/api";
import { passwordResetEmailHtml, passwordResetEmailSubject, passwordResetEmailText } from "@/server/utils/emailTemplates";
import { sendMail } from "@/server/utils/mailer";
import bcrypt from "bcryptjs";
import { z } from "zod";

function randomToken(): string {
  return [...crypto.getRandomValues(new Uint8Array(32))].map((b) => b.toString(16).padStart(2, "0")).join("");
}

const ForgotSchema = z.object({ email: z.string().email() });

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = ForgotSchema.safeParse(body);
  if (!parsed.success) return jsonError("Email required", 400);
  const { email } = parsed.data;
  await connectToDatabase();
  const user = await User.findOne({ email });
  if (!user) return jsonOk({});

  const token = randomToken();
  const token_hash = await bcrypt.hash(token, 10);
  const expires_at = new Date(Date.now() + 1000 * 60 * 30); // 30 minutes
  await PasswordResetToken.create({ user_id: user._id, token_hash, expires_at });

  // Create reset URL
  const baseUrl = process.env.BASE_URL || "http://localhost:3000";
  const resetUrl = `${baseUrl}/auth/reset-password?token=${token}&email=${encodeURIComponent(email)}`;

  // Send beautiful password reset email
  const subject = passwordResetEmailSubject();
  const html = passwordResetEmailHtml({
    resetUrl,
    email,
    appName: "AgriReach",
    expireMinutes: 30
  });
  const text = passwordResetEmailText({
    resetUrl,
    appName: "AgriReach",
    expireMinutes: 30
  });

  try {
    await sendMail({ to: email, subject, html, text });
  } catch (e: any) {
    return jsonError("Failed to send reset email", 500, e?.message);
  }

  return jsonOk({ message: "Password reset email sent successfully" });
}
