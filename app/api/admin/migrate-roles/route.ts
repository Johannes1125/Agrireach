import { NextRequest } from "next/server";
import { connectToDatabase } from "@/server/lib/mongodb";
import { User } from "@/server/models/User";
import { jsonOk, jsonError, requireMethod, getAuthToken } from "@/server/utils/api";
import { verifyToken } from "@/server/utils/auth";

export async function POST(req: NextRequest) {
  const mm = requireMethod(req, ["POST"]);
  if (mm) return mm;

  // Verify admin access
  const token = getAuthToken(req, "access");
  if (!token) return jsonError("Unauthorized", 401);

  let decoded: any;
  try {
    decoded = verifyToken<any>(token, "access");
  } catch {
    return jsonError("Unauthorized", 401);
  }

  // Only admins can run migrations
  if (decoded.role !== "admin") {
    return jsonError("Forbidden - Admin access required", 403);
  }

  await connectToDatabase();

  try {
    console.log("\n=== STARTING ROLE MIGRATION ===");

    // Find all users
    const allUsers = await User.find({});
    console.log(`Total users in database: ${allUsers.length}`);

    let migratedCount = 0;
    let alreadyMigratedCount = 0;
    let errorCount = 0;

    for (const user of allUsers) {
      try {
        // Check if user already has roles array
        if (user.roles && Array.isArray(user.roles) && user.roles.length > 0) {
          console.log(`✓ User ${user.email} already has roles:`, user.roles);
          alreadyMigratedCount++;
          continue;
        }

        // User needs migration - create roles array from role field
        if (user.role) {
          user.roles = [user.role];
          await user.save();
          console.log(`✓ Migrated user ${user.email}: role="${user.role}" → roles=[${user.roles}]`);
          migratedCount++;
        } else {
          console.log(`⚠ User ${user.email} has no role field, skipping`);
        }
      } catch (error) {
        console.error(`✗ Error migrating user ${user.email}:`, error);
        errorCount++;
      }
    }

    console.log("\n=== MIGRATION COMPLETE ===");
    console.log(`Total users: ${allUsers.length}`);
    console.log(`Migrated: ${migratedCount}`);
    console.log(`Already migrated: ${alreadyMigratedCount}`);
    console.log(`Errors: ${errorCount}`);
    console.log("========================\n");

    return jsonOk({
      success: true,
      message: "Role migration completed successfully",
      stats: {
        total_users: allUsers.length,
        migrated: migratedCount,
        already_migrated: alreadyMigratedCount,
        errors: errorCount
      }
    });
  } catch (error: any) {
    console.error("Migration failed:", error);
    return jsonError(error.message || "Migration failed", 500);
  }
}

