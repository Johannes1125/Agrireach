import { NextRequest } from "next/server";
import { connectToDatabase } from "../lib/mongodb";
import { User } from "../models/User";
import { UserSession } from "../models/UserSession";

import { jsonOk, jsonError, setAuthCookies, getAuthToken, clearAuthCookies } from "../utils/api";
import { hashPassword, signAccessToken, signRefreshToken, verifyPassword, verifyToken, verifyGoogleIdToken } from "../utils/auth";
import bcrypt from "bcryptjs";

export const AuthController = {
  async register(req: NextRequest, payload: { email: string; password: string; name: string; role?: string }) {
    await connectToDatabase();
    const exists = await User.findOne({ email: payload.email });
    if (exists) return jsonError("Email already registered", 409);
    const password_hash = await hashPassword(payload.password);
    const selectedRole = payload.role || "worker";
    const user = await User.create({
      email: payload.email,
      password_hash,
      full_name: payload.name,
      role: selectedRole,
      roles: [selectedRole] // Initialize roles array with the selected role
    });
    const res = jsonOk({ id: user._id, email: user.email, full_name: user.full_name, role: user.role });
    return res;
  },

  async login(req: NextRequest, payload: { email: string; password: string }) {
    await connectToDatabase();
    const user = await User.findOne({ email: payload.email });
    if (!user) return jsonError("Invalid credentials", 401);
    const valid = await verifyPassword(payload.password, user.password_hash);
    if (!valid) return jsonError("Invalid credentials", 401);
    const accessToken = signAccessToken({ sub: String(user._id), role: user.role });
    const refreshToken = signRefreshToken({ sub: String(user._id), role: user.role });
    const tokenHash = await bcrypt.hash(refreshToken, 10);
    const expiresAt = new Date(Date.now() + (parseInt(process.env.JWT_REFRESH_TTL_DAYS || "7", 10) * 24 * 60 * 60 * 1000));
    await UserSession.create({ user_id: user._id, token: tokenHash, expires_at: expiresAt });
    const res = jsonOk({ accessToken, refreshToken });
    return setAuthCookies(res, { accessToken, refreshToken });
  },

  async refresh(req: NextRequest) {
    const token = getAuthToken(req, "refresh");
    if (!token) return jsonError("Missing token", 401);
    let decoded: any;
    try {
      decoded = verifyToken(token, "refresh");
    } catch {
      return jsonError("Invalid token", 401);
    }

    await connectToDatabase();
    const accessToken = signAccessToken({ sub: String(decoded.sub), role: decoded.role });
    const res = jsonOk({ accessToken });
    return setAuthCookies(res, { accessToken });
  },

  async logout(req: NextRequest) {
    const token = getAuthToken(req, "refresh");
    try {
      if (token) {
        const decoded: any = verifyToken(token, "refresh");
        await connectToDatabase();
        await UserSession.deleteMany({ user_id: decoded.sub });
      }
    } catch {
      // ignore token errors for logout
    }
    const res = jsonOk({});
    return clearAuthCookies(res);
  },

  async google(req: NextRequest, payload: { idToken: string; role?: string }) {
    const data = await verifyGoogleIdToken(payload.idToken);
    if (!data) return jsonError("Invalid Google token", 401);
    await connectToDatabase();
    let user = await User.findOne({ email: data.email });
    if (!user) {
      const random = await bcrypt.genSalt(8);
      const selectedRole = payload.role || "buyer";
      user = await User.create({
        email: data.email,
        password_hash: random, // not used for google users
        full_name: data.name || data.email.split("@")[0],
        role: selectedRole, // Default to buyer for Google OAuth users
        roles: [selectedRole], // Initialize roles array
        avatar_url: data.picture,
        verified: true,
      });
    }
    const accessToken = signAccessToken({ sub: String(user._id), role: user.role });
    const refreshToken = signRefreshToken({ sub: String(user._id), role: user.role });
    const tokenHash = await bcrypt.hash(refreshToken, 10);
    const expiresAt = new Date(Date.now() + (parseInt(process.env.JWT_REFRESH_TTL_DAYS || "7", 10) * 24 * 60 * 60 * 1000));
    await UserSession.create({ user_id: user._id, token: tokenHash, expires_at: expiresAt });
    const res = jsonOk({ accessToken, refreshToken });
    return setAuthCookies(res, { accessToken, refreshToken });
  },
};


