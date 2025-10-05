import { NextRequest } from "next/server"
import { requireMethod, jsonError, jsonOk, getAuthToken } from "@/server/utils/api"
import { verifyToken } from "@/server/utils/auth"
import { connectToDatabase } from "@/server/lib/mongodb"
import { Opportunity } from "@/server/models/Job"

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const mm = requireMethod(req, ["PUT"])
  if (mm) return mm
  const token = getAuthToken(req, "access")
  if (!token) return jsonError("Unauthorized", 401)
  let decoded: any; try { decoded = verifyToken<any>(token, "access") } catch { return jsonError("Unauthorized", 401) }
  if (decoded.role !== "admin") return jsonError("Forbidden", 403)
  await connectToDatabase()
  const body = await req.json().catch(() => ({}))
  const { action } = body || {}
  if (!action) return jsonError('Missing action', 400)
  let set: any = {}
  if (action === 'open' || action === 'approve') set.status = 'active'
  else if (action === 'close') set.status = 'closed'
  else if (action === 'remove') set.status = 'hidden'
  else return jsonError('Invalid action', 400)
  const updated = await Opportunity.findByIdAndUpdate(params.id, { $set: set }, { new: true })
  if (!updated) return jsonError('Opportunity not found', 404)
  return jsonOk({ opportunity: updated })
}


