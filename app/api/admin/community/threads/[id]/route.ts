import { NextRequest } from "next/server"
import { requireMethod, jsonError, jsonOk, getAuthToken } from "@/server/utils/api"
import { verifyToken } from "@/server/utils/auth"
import { connectToDatabase } from "@/server/lib/mongodb"
import { Thread } from "@/server/models/Thread"

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
  if (!action) return jsonError("Missing action", 400)

  let set: any = {}
  switch (action) {
    case 'pin': set.pinned = true; break
    case 'unpin': set.pinned = false; break
    case 'lock': set.locked = true; break
    case 'unlock': set.locked = false; break
    case 'hide': set.status = 'hidden'; break
    case 'restore': set.status = 'active'; break
    case 'approve': set.status = 'active'; break
    default: return jsonError('Invalid action', 400)
  }

  const updated = await Thread.findByIdAndUpdate(id, { $set: set }, { new: true })
  if (!updated) return jsonError('Thread not found', 404)
  return jsonOk({ thread: updated })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const mm = requireMethod(req, ["DELETE"])
  if (mm) return mm
  const token = getAuthToken(req, "access")
  if (!token) return jsonError("Unauthorized", 401)
  let decoded: any; try { decoded = verifyToken<any>(token, "access") } catch { return jsonError("Unauthorized", 401) }
  if (decoded.role !== "admin") return jsonError("Forbidden", 403)
  const { id } = await params
  await connectToDatabase()
  await Thread.findByIdAndDelete(id)
  return jsonOk({ message: 'Deleted' })
}


