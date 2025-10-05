import { NextRequest } from "next/server";
import { requireMethod } from "@/server/utils/api";
import { validateBody } from "@/server/middleware/validate";
import { LoginSchema } from "@/server/validators/authSchemas";
import { AuthController } from "@/server/controllers/authController";

export async function POST(req: NextRequest) {
  const mm = requireMethod(req, ["POST"]);
  if (mm) return mm;
  const validate = validateBody(LoginSchema);
  const result = await validate(req);
  if (!result.ok) return result.res;
  return AuthController.login(req, result.data);
}
