import { NextRequest } from "next/server"
import { requireMethod, jsonError, jsonOk, getAuthToken } from "@/server/utils/api"
import { verifyToken } from "@/server/utils/auth"
import { connectToDatabase } from "@/server/lib/mongodb"
import { Report } from "@/server/models/Report"

// Placeholder: If you have a dedicated Report model, replace this aggregation accordingly

export async function GET(req: NextRequest) {
  const mm = requireMethod(req, ["GET"])
  if (mm) return mm
  const token = getAuthToken(req, "access")
  if (!token) return jsonError("Unauthorized", 401)
  let decoded: any; try { decoded = verifyToken<any>(token, "access") } catch { return jsonError("Unauthorized", 401) }
  if (decoded.role !== "admin") return jsonError("Forbidden", 403)

  await connectToDatabase()

  const url = new URL(req.url)
  const q = url.searchParams
  const filter: any = {}
  if (q.get('status') && q.get('status') !== 'all') filter.status = q.get('status')
  if (q.get('priority') && q.get('priority') !== 'all') filter.priority = q.get('priority')
  const page = parseInt(q.get('page') || '1', 10)
  const limit = Math.min(parseInt(q.get('limit') || '50', 10), 100)
  const skip = (page - 1) * limit

  const [items, total] = await Promise.all([
    Report.find(filter).sort({ created_at: -1 }).skip(skip).limit(limit).lean(),
    Report.countDocuments(filter)
  ])
  return jsonOk({ reports: items, total, page, pages: Math.ceil(total / limit) })
}

export async function PUT(req: NextRequest) {
  const mm = requireMethod(req, ["PUT"])
  if (mm) return mm
  const token = getAuthToken(req, "access")
  if (!token) return jsonError("Unauthorized", 401)
  let decoded: any; try { decoded = verifyToken<any>(token, "access") } catch { return jsonError("Unauthorized", 401) }
  if (decoded.role !== "admin") return jsonError("Forbidden", 403)

  const body = await req.json().catch(() => ({}))
  const { id, action, resolution } = body || {}
  if (!id || !action) return jsonError('Missing id or action', 400)

  await connectToDatabase()
  let set: any = {}
  if (action === 'resolve') set = { status: 'resolved', resolution: resolution || '' }
  else if (action === 'dismiss') set = { status: 'dismissed', resolution: resolution || '' }
  else return jsonError('Invalid action', 400)

  const updated = await Report.findByIdAndUpdate(id, { $set: set }, { new: true })
  if (!updated) return jsonError('Report not found', 404)
  return jsonOk({ report: updated })
}
