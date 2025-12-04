import { NextRequest } from "next/server";
import { connectToDatabase } from "@/server/lib/mongodb";
import { OtpCode } from "@/server/models/OtpCode";
import { requireMethod, jsonOk, jsonError, getAuthToken } from "@/server/utils/api";
import { verifyToken } from "@/server/utils/auth";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { z } from "zod";

const VerifyOtpSchema = z.object({
  email: z.string().email(),
  code: z.string().length(6).regex(/^\d{6}$/),
});

// Store verified tokens temporarily (in production, use Redis)
const verifiedTokens = new Map<string, { email: string; expiresAt: Date }>();

// Clean up expired tokens periodically
setInterval(() => {
  const now = new Date();
  for (const [token, data] of verifiedTokens.entries()) {
    if (data.expiresAt < now) {
      verifiedTokens.delete(token);
    }
  }
}, 60 * 1000); // Clean every minute

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
    const parsed = VerifyOtpSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError("Invalid verification code format", 400);
    }

    const { email, code } = parsed.data;
    
    await connectToDatabase();

    // Find recent OTP codes for this email
    const records = await OtpCode.find({ 
      email, 
      type: "checkout", 
      used: false 
    })
      .sort({ created_at: -1 })
      .limit(5)
      .lean();

    if (records.length === 0) {
      return jsonError("No verification code found. Please request a new code.", 400);
    }

    // Check each code
    for (const rec of records) {
      const isMatch = await bcrypt.compare(code, rec.code);
      if (isMatch) {
        // Check if expired
        if (new Date(rec.expires_at) < new Date()) {
          return jsonError("Verification code has expired. Please request a new code.", 400);
        }

        // Mark code as used
        await OtpCode.updateMany(
          { email, type: "checkout" },
          { $set: { used: true } }
        );

        // Generate a temporary checkout token
        const checkoutToken = crypto.randomBytes(32).toString("hex");
        const tokenExpiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

        // Store the token
        verifiedTokens.set(checkoutToken, {
          email,
          expiresAt: tokenExpiresAt,
        });

        return jsonOk({ 
          message: "Verification successful",
          checkoutToken,
          expiresAt: tokenExpiresAt.toISOString()
        });
      }
    }

    return jsonError("Invalid verification code", 400);
  } catch (error: any) {
    console.error("Verify checkout OTP error:", error);
    return jsonError("Verification failed", 500, error?.message);
  }
}

// Export for use in create-payment
export function validateCheckoutToken(token: string, email: string): boolean {
  const data = verifiedTokens.get(token);
  if (!data) return false;
  if (data.expiresAt < new Date()) {
    verifiedTokens.delete(token);
    return false;
  }
  if (data.email !== email) return false;
  
  // Token is valid, consume it
  verifiedTokens.delete(token);
  return true;
}

