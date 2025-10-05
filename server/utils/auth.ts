import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";

export type JwtKinds = "access" | "refresh";

export interface JwtPayloadBase {
  sub: string; // user id
  role: string;
  kind: JwtKinds;
}

const ACCESS_TTL_MIN = parseInt(process.env.JWT_ACCESS_TTL_MIN || "15", 10);
const REFRESH_TTL_DAYS = parseInt(process.env.JWT_REFRESH_TTL_DAYS || "7", 10);

export async function hashPassword(plain: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plain, salt);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export function signAccessToken(payload: Omit<JwtPayloadBase, "kind">): string {
  const secret = process.env.JWT_ACCESS_SECRET as string;
  return jwt.sign({ ...payload, kind: "access" }, secret, { expiresIn: `${ACCESS_TTL_MIN}m` });
}

export function signRefreshToken(payload: Omit<JwtPayloadBase, "kind">): string {
  const secret = process.env.JWT_REFRESH_SECRET as string;
  return jwt.sign({ ...payload, kind: "refresh" }, secret, { expiresIn: `${REFRESH_TTL_DAYS}d` });
}

export function verifyToken<T = JwtPayloadBase>(token: string, kind: JwtKinds): T {
  const secret = kind === "access" ? (process.env.JWT_ACCESS_SECRET as string) : (process.env.JWT_REFRESH_SECRET as string);
  const decoded = jwt.verify(token, secret) as T & { kind: JwtKinds };
  if ((decoded as any).kind !== kind) throw new Error("Invalid token kind");
  return decoded as unknown as T;
}

export function hasRole(userRole: string, required: string | string[]): boolean {
  const need = Array.isArray(required) ? required : [required];
  return need.includes(userRole);
}

let googleClient: OAuth2Client | null = null;
function getGoogleClient(): OAuth2Client {
  if (!googleClient) {
    googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET);
  }
  return googleClient;
}

export async function verifyGoogleIdToken(idToken: string): Promise<{ email: string; name?: string; picture?: string } | null> {
  const client = getGoogleClient();
  const ticket = await client.verifyIdToken({ idToken, audience: process.env.GOOGLE_CLIENT_ID });
  const payload = ticket.getPayload();
  if (!payload || !payload.email) return null;
  return { email: payload.email, name: payload.name || undefined, picture: payload.picture || undefined };
}
