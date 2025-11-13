import { NextRequest, NextResponse } from "next/server";
import { requireMethod, jsonError, jsonOk, setAuthCookies } from "@/server/utils/api";
import { validateBody } from "@/server/middleware/validate";
import { connectToDatabase } from "@/server/lib/mongodb";
import { User } from "@/server/models/User";
import { UserSession } from "@/server/models/UserSession";
import { verifyPassword, signAccessToken, signRefreshToken } from "@/server/utils/auth";
import { z } from "zod";
import bcrypt from "bcryptjs";

const AdminLoginSchema = z.object({ 
  email: z.string().email(), 
  password: z.string().min(1) 
});

export async function POST(req: NextRequest) {
  const mm = requireMethod(req, ["POST"]);
  if (mm) return mm;
  
  const validate = validateBody(AdminLoginSchema);
  const result = await validate(req);
  if (!result.ok) return result.res;

  const { email, password } = result.data;

  await connectToDatabase();

  // Find user by email
  const user = await User.findOne({ email });
  if (!user) return jsonError("Invalid email or password", 401);

  // Check if user is admin
  if (user.role !== "admin") {
    return jsonError("Access denied. Admin privileges required.", 403);
  }

  // Ensure admin user has roles field initialized
  if (!user.roles || !Array.isArray(user.roles)) {
    await User.findByIdAndUpdate(user._id, { 
      roles: ["admin"],
      role: "admin" 
    });
    user.roles = ["admin"];
  }

  // Verify password
  const valid = await verifyPassword(password, user.password_hash);
  if (!valid) return jsonError("Invalid email or password", 401);

  // Check if account is active
  if (user.status !== "active") {
    return jsonError(`Account is ${user.status}. Please contact support.`, 403);
  }

  // Generate tokens
  const userId = String(user._id);
  const accessToken = signAccessToken({ 
    sub: userId, 
    role: user.role,
    roles: user.roles || [user.role]
  });
  const refreshToken = signRefreshToken({ 
    sub: userId, 
    role: user.role,
    roles: user.roles || [user.role]
  });

  // Save session
  const tokenHash = await bcrypt.hash(refreshToken, 10);
  await UserSession.create({
    user_id: user._id as any,
    token: tokenHash,
    expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7), // 7 days
  });

  // Update last login
  await User.findByIdAndUpdate(user._id as any, { last_login: new Date() });

  // Create response with cookies
  const response = jsonOk({ 
    user: {
      id: userId,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      roles: user.roles || [user.role],
    }
  });

  // Set auth cookies
  setAuthCookies(response, { accessToken, refreshToken });

  return response;
}


