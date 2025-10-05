import { NextRequest, NextResponse } from "next/server";
import { ZodSchema } from "zod";
import { jsonError } from "../utils/api";

export function validateBody<T>(schema: ZodSchema<T>) {
  return async (req: NextRequest): Promise<{ ok: true; data: T } | { ok: false; res: NextResponse }> => {
    try {
      const json = await req.json();
      const parsed = schema.safeParse(json);
      if (!parsed.success) {
        return { ok: false, res: jsonError("Validation failed", 422, parsed.error.flatten()) };
      }
      return { ok: true, data: parsed.data };
    } catch (e: any) {
      return { ok: false, res: jsonError("Invalid JSON", 400) };
    }
  };
}


