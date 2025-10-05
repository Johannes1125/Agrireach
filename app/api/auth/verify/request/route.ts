import { NextRequest } from "next/server";
import { connectToDatabase } from "@/server/lib/mongodb";
import { User } from "@/server/models/User";
import { OtpCode } from "@/server/models/OtpCode";
import { jsonOk, jsonError } from "@/server/utils/api";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { verificationOtpEmailHtml, verificationOtpEmailSubject, verificationOtpEmailText } from "@/server/utils/emailTemplates";
import { sendMail } from "@/server/utils/mailer";

function randomToken(): string {
  return [...crypto.getRandomValues(new Uint8Array(32))].map((b) => b.toString(16).padStart(2, "0")).join("");
}

const VerifyRequestSchema = z.object({ email: z.string().email(), name: z.string().optional(), type: z.enum(["registration"]).default("registration") });

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = VerifyRequestSchema.safeParse(body);
  if (!parsed.success) return jsonError("Email required", 400);
  const { email, name } = parsed.data;
  await connectToDatabase();
  const existing = await User.findOne({ email });
  if (existing) return jsonError("Email already registered", 409);

  // Generate a 6-digit numeric OTP
  const token = `${Math.floor(100000 + Math.random() * 900000)}`;
  const token_hash = await bcrypt.hash(token, 10);
  const expires_at = new Date(Date.now() + 1000 * 60 * 60); // 1 hour
  await OtpCode.create({ email, code: token_hash, type: "registration", expires_at, used: false });

  const subject = verificationOtpEmailSubject();
  const html = verificationOtpEmailHtml({ code: token, email, appName: "AgriReach", expireMinutes: 10 });
  const text = verificationOtpEmailText({ code: token, appName: "AgriReach", expireMinutes: 10 });

  try {
    await sendMail({ to: email, subject, html, text });
  } catch (e: any) {
    return jsonError("Failed to send email", 500, e?.message);
  }
  return jsonOk({});
}
