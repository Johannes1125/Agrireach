import { NextRequest } from "next/server";
import { connectToDatabase } from "@/server/lib/mongodb";
import { User } from "@/server/models/User";
import { jsonError } from "@/server/utils/api";
import { getAuthToken } from "@/server/utils/api";
import { verifyToken } from "@/server/utils/auth";

export type UserRole = "worker" | "recruiter" | "buyer" | "admin";

/**
 * Validates if the authenticated user has the required role(s)
 * Checks both the legacy 'role' field and the new 'roles' array
 * 
 * @param req - NextRequest object
 * @param requiredRoles - Array of roles that are allowed to access the function
 * @param options - Additional options for validation
 * @returns User object if valid, throws error if invalid
 */
export async function validateUserRole(
  req: NextRequest,
  requiredRoles: UserRole[],
  options: {
    allowAdmin?: boolean; // Whether admin role can bypass this check
    requireAuth?: boolean; // Whether authentication is required
  } = {}
): Promise<{ user: any; userId: string }> {
  const { allowAdmin = true, requireAuth = true } = options;

  // Get authentication token
  const token = getAuthToken(req, "access");
  if (!token) {
    if (requireAuth) {
      throw new Error("Unauthorized - No authentication token");
    }
    throw new Error("Authentication required");
  }

  // Verify token
  let decoded: any;
  try {
    decoded = verifyToken<any>(token, "access");
  } catch {
    throw new Error("Unauthorized - Invalid token");
  }

  const userId = decoded.sub;
  if (!userId) {
    throw new Error("Unauthorized - Invalid user ID");
  }

  // Connect to database and get user
  await connectToDatabase();
  const user = await User.findById(userId).select("role roles full_name email").lean();
  
  if (!user) {
    throw new Error("User not found");
  }

  // Get user's roles (check both legacy 'role' and new 'roles' array)
  const userRoles = user.roles || [user.role];
  
  // Check if user has admin role and admin is allowed to bypass
  if (allowAdmin && userRoles.includes("admin")) {
    return { user, userId };
  }

  // Check if user has any of the required roles
  const hasRequiredRole = requiredRoles.some(role => userRoles.includes(role));
  
  if (!hasRequiredRole) {
    const roleText = requiredRoles.length === 1 ? requiredRoles[0] : requiredRoles.join(", ");
    throw new Error(`Access denied - You need ${roleText} role(s) to access this feature. Please update your roles in Settings.`);
  }

  return { user, userId };
}

/**
 * Middleware wrapper for role validation
 * Returns a function that can be used in API routes
 */
export function requireRole(requiredRoles: UserRole[], options?: { allowAdmin?: boolean }) {
  return async (req: NextRequest) => {
    try {
      const { user, userId } = await validateUserRole(req, requiredRoles, options);
      return { user, userId };
    } catch (error: any) {
      return jsonError(error.message, 403);
    }
  };
}

/**
 * Quick role validation for common scenarios
 */
export const RoleValidators = {
  // Job posting functions
  requireRecruiter: requireRole(["recruiter"]),
  requireWorker: requireRole(["worker"]),
  requireBuyer: requireRole(["buyer"]),
  
  // Multi-role functions
  requireWorkerOrRecruiter: requireRole(["worker", "recruiter"]),
  requireRecruiterOrBuyer: requireRole(["recruiter", "buyer"]),
  requireWorkerOrBuyer: requireRole(["worker", "buyer"]),
  requireAnyRole: requireRole(["worker", "recruiter", "buyer"]),
  
  // Admin functions (admin can bypass all checks)
  requireAdmin: requireRole(["admin"], { allowAdmin: false }),
};