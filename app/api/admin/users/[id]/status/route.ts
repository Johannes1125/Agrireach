import { NextRequest } from "next/server";
import { requireMethod, jsonError, jsonOk, getAuthToken } from "@/server/utils/api";
import { verifyToken } from "@/server/utils/auth";
import { validateBody } from "@/server/middleware/validate";
import { connectToDatabase } from "@/server/lib/mongodb";
import { User } from "@/server/models/User";
import { AdminActivityLog } from "@/server/models/Report";
import { Notification } from "@/server/models/Notification";
import { z } from "zod";

const UpdateStatusSchema = z.object({
  status: z.enum(["active", "suspended", "banned"]),
  reason: z.string().optional(),
});

async function requireAdmin(req: NextRequest) {
  const token = getAuthToken(req, "access");
  if (!token) return null;

  try {
    const decoded = verifyToken<any>(token, "access");
    await connectToDatabase();
    const user = await User.findById(decoded.sub);
    return user && user.role === "admin" ? decoded : null;
  } catch {
    return null;
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const mm = requireMethod(req, ["PUT"]);
  if (mm) return mm;

  const admin = await requireAdmin(req);
  if (!admin) return jsonError("Forbidden - Admin access required", 403);

  const validate = validateBody(UpdateStatusSchema);
  const result = await validate(req);
  if (!result.ok) return result.res;

  const { status, reason } = result.data;

  await connectToDatabase();
  
  const user = await User.findById(params.id);
  if (!user) return jsonError("User not found", 404);

  // Prevent admin from changing their own status
  if (user._id.toString() === admin.sub) {
    return jsonError("Cannot change your own status", 400);
  }

  const oldStatus = user.status;
  
  // Update user status
  await User.findByIdAndUpdate(params.id, {
    $set: { status }
  });

  // Log admin activity
  await AdminActivityLog.create({
    admin_id: admin.sub,
    action: `user_status_changed`,
    target_type: 'user',
    target_id: params.id,
    details: {
      old_status: oldStatus,
      new_status: status,
      reason: reason || 'No reason provided'
    }
  });

  // Send notification to user
  let notificationMessage = '';
  switch (status) {
    case 'suspended':
      notificationMessage = `Your account has been suspended. ${reason ? `Reason: ${reason}` : ''}`;
      break;
    case 'banned':
      notificationMessage = `Your account has been banned. ${reason ? `Reason: ${reason}` : ''}`;
      break;
    case 'active':
      notificationMessage = 'Your account has been reactivated.';
      break;
  }

  await Notification.create({
    user_id: params.id,
    type: 'account_status',
    title: 'Account Status Updated',
    message: notificationMessage,
    priority: 'high'
  });

  return jsonOk({ 
    message: `User status updated to ${status}`,
    user: {
      id: user._id,
      full_name: user.full_name,
      email: user.email,
      status
    }
  });
}
