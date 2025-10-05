import { NextRequest } from "next/server";
import { requireMethod } from "@/server/utils/api";
import { AuthController } from "@/server/controllers/authController";
import { validateBody } from "@/server/middleware/validate";
import { GoogleSchema } from "@/server/validators/authSchemas";

export async function POST(req: NextRequest) {
  const mm = requireMethod(req, ["POST"]);
  if (mm) return mm;
  const validate = validateBody(GoogleSchema);
  const result = await validate(req);
  if (!result.ok) return result.res;
  return AuthController.google(req, result.data);
}



