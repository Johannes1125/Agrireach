import { NextRequest } from "next/server"
import { requireMethod, jsonError, jsonOk, getAuthToken } from "@/server/utils/api"
import { verifyToken } from "@/server/utils/auth"
import { connectToDatabase } from "@/server/lib/mongodb"
import { Product } from "@/server/models/Product"

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const mm = requireMethod(req, ["PUT"])
  if (mm) return mm
  const token = getAuthToken(req, "access")
  if (!token) return jsonError("Unauthorized", 401)
  let decoded: any; try { decoded = verifyToken<any>(token, "access") } catch { return jsonError("Unauthorized", 401) }
  if (decoded.role !== "admin") return jsonError("Forbidden", 403)
  const { id } = await params
  await connectToDatabase()
  const body = await req.json().catch(() => ({}))
  const { action } = body || {}
  if (!action) return jsonError('Missing action', 400)
  let set: any = {}
  if (action === 'approve') set.status = 'active'
  else if (action === 'remove') set.status = 'removed'
  else return jsonError('Invalid action', 400)
  const updated = await Product.findByIdAndUpdate(id, { $set: set }, { new: true })
  if (!updated) return jsonError('Product not found', 404)
  return jsonOk({ product: updated })
}


