import { NextRequest } from "next/server";
import { AuthController } from "@/server/controllers/authController";

export async function POST(req: NextRequest) {
  return AuthController.refresh(req);
}
