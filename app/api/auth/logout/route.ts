import { NextRequest } from "next/server";
import { requireMethod } from "@/server/utils/api";
import { AuthController } from "@/server/controllers/authController";

export async function POST(req: NextRequest) {
  const mm = requireMethod(req, ["POST"]);
  if (mm) return mm;
  return AuthController.logout(req);
}
