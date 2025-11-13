import { NextRequest } from "next/server";
import { connectToDatabase } from "@/server/lib/mongodb";
import { User, UserRole } from "@/server/models/User";
import { jsonOk, jsonError, requireMethod, getAuthToken } from "@/server/utils/api";
import { verifyToken } from "@/server/utils/auth";
import { z } from "zod";

const UpdateRolesSchema = z.object({
  roles: z.array(z.enum(["worker", "recruiter", "buyer", "admin"])).min(1).max(4),
});

// GET user roles
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const mm = requireMethod(req, ["GET"]);
  if (mm) return mm;

  const token = getAuthToken(req, "access");
  if (!token) return jsonError("Unauthorized", 401);

  let decoded: any;
  try {
    decoded = verifyToken<any>(token, "access");
  } catch {
    return jsonError("Unauthorized", 401);
  }

  const { id } = await params;

  // Users can only view their own roles, unless they're admin
  if (decoded.sub !== id) {
    const currentUser = await User.findById(decoded.sub).select("roles role").lean();
    const userRoles = currentUser?.roles || [currentUser?.role];
    if (!userRoles?.includes("admin")) {
      return jsonError("Forbidden", 403);
    }
  }

  await connectToDatabase();

  const user = await User.findById(id).select("roles role").lean();
  if (!user) return jsonError("User not found", 404);

  const roles = user.roles || [user.role];

  return jsonOk({ roles });
}

// PUT - Update user roles
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const mm = requireMethod(req, ["PUT"]);
  if (mm) return mm;

  const token = getAuthToken(req, "access");
  if (!token) return jsonError("Unauthorized", 401);

  let decoded: any;
  try {
    decoded = verifyToken<any>(token, "access");
  } catch {
    return jsonError("Unauthorized", 401);
  }

  const { id } = await params;

  // Users can only update their own roles (except admin role)
  if (decoded.sub !== id) {
    const currentUser = await User.findById(decoded.sub).select("roles role").lean();
    const userRoles = currentUser?.roles || [currentUser?.role];
    if (!userRoles?.includes("admin")) {
      return jsonError("Forbidden", 403);
    }
  }

  await connectToDatabase();

  const body = await req.json();
  const result = UpdateRolesSchema.safeParse(body);

  if (!result.success) {
    const firstIssue = result.error.issues[0];
    return jsonError(firstIssue?.message || "Invalid payload", 400);
  }

  const { roles } = result.data;

  // Prevent non-admins from adding admin role
  const currentUser = await User.findById(decoded.sub).select("roles role").lean();
  const currentUserRoles = currentUser?.roles || [currentUser?.role];
  
  if (roles.includes("admin") && !currentUserRoles?.includes("admin")) {
    return jsonError("You cannot add admin role to yourself", 403);
  }

  // Update user roles
  const user = await User.findByIdAndUpdate(
    id,
    { 
      roles,
      role: roles[0] // Keep legacy field in sync
    },
    { new: true }
  ).select("roles role full_name email");

  if (!user) return jsonError("User not found", 404);

  // Invalidate all user sessions to force re-login with new roles
  const { UserSession } = await import("@/server/models/UserSession");
  await UserSession.deleteMany({ user_id: id });

  return jsonOk({ 
    roles: user.roles,
    message: "Roles updated successfully. Please log in again to refresh your permissions."
  });
}

// POST - Add a role to user
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const mm = requireMethod(req, ["POST"]);
  if (mm) return mm;

  const token = getAuthToken(req, "access");
  if (!token) return jsonError("Unauthorized", 401);

  let decoded: any;
  try {
    decoded = verifyToken<any>(token, "access");
  } catch {
    return jsonError("Unauthorized", 401);
  }

  const { id } = await params;

  // Users can only update their own roles
  if (decoded.sub !== id) {
    const currentUser = await User.findById(decoded.sub).select("roles role").lean();
    const userRoles = currentUser?.roles || [currentUser?.role];
    if (!userRoles?.includes("admin")) {
      return jsonError("Forbidden", 403);
    }
  }

  await connectToDatabase();

  const body = await req.json();
  const { role } = body;

  if (!role || !["worker", "recruiter", "buyer", "admin"].includes(role)) {
    return jsonError("Invalid role", 400);
  }

  // Prevent non-admins from adding admin role
  const currentUser = await User.findById(decoded.sub).select("roles role").lean();
  const currentUserRoles = currentUser?.roles || [currentUser?.role];
  
  if (role === "admin" && !currentUserRoles?.includes("admin")) {
    return jsonError("You cannot add admin role", 403);
  }

  const user = await User.findById(id).select("roles role");
  if (!user) return jsonError("User not found", 404);

  const userRoles = user.roles || [user.role];

  if (userRoles.includes(role as UserRole)) {
    return jsonError("User already has this role", 400);
  }

  userRoles.push(role as UserRole);

  await User.findByIdAndUpdate(id, {
    roles: userRoles,
    role: userRoles[0]
  });

  return jsonOk({ 
    roles: userRoles,
    message: "Role added successfully"
  });
}

// DELETE - Remove a role from user
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const mm = requireMethod(req, ["DELETE"]);
  if (mm) return mm;

  const token = getAuthToken(req, "access");
  if (!token) return jsonError("Unauthorized", 401);

  let decoded: any;
  try {
    decoded = verifyToken<any>(token, "access");
  } catch {
    return jsonError("Unauthorized", 401);
  }

  const { id } = await params;

  // Users can only update their own roles
  if (decoded.sub !== id) {
    const currentUser = await User.findById(decoded.sub).select("roles role").lean();
    const userRoles = currentUser?.roles || [currentUser?.role];
    if (!userRoles?.includes("admin")) {
      return jsonError("Forbidden", 403);
    }
  }

  await connectToDatabase();

  const { searchParams } = new URL(req.url);
  const roleToRemove = searchParams.get("role");

  if (!roleToRemove || !["worker", "recruiter", "buyer", "admin"].includes(roleToRemove)) {
    return jsonError("Invalid role", 400);
  }

  const user = await User.findById(id).select("roles role");
  if (!user) return jsonError("User not found", 404);

  const userRoles = user.roles || [user.role];

  if (userRoles.length <= 1) {
    return jsonError("User must have at least one role", 400);
  }

  const updatedRoles = userRoles.filter(r => r !== roleToRemove);

  await User.findByIdAndUpdate(id, {
    roles: updatedRoles,
    role: updatedRoles[0]
  });

  return jsonOk({ 
    roles: updatedRoles,
    message: "Role removed successfully"
  });
}
