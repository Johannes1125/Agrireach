import { NextRequest } from "next/server";
import { requireMethod, jsonError } from "@/server/utils/api";
import { validateBody } from "@/server/middleware/validate";
import { z } from "zod";

const AdminLoginSchema = z.object({ username: z.string().min(1), password: z.string().min(1) });

export async function POST(req: NextRequest) {
  const mm = requireMethod(req, ["POST"]);
  if (mm) return mm;
  const validate = validateBody(AdminLoginSchema);
  const result = await validate(req);
  if (!result.ok) return result.res;
  return jsonError("Admin auth not implemented yet", 501);
}


