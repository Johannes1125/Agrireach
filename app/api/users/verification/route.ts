import { NextRequest } from "next/server"
import { requireMethod, jsonError, jsonOk, getAuthToken } from "@/server/utils/api"
import { verifyToken } from "@/server/utils/auth"
import { connectToDatabase } from "@/server/lib/mongodb"
import { User } from "@/server/models/User"

async function authenticate(req: NextRequest) {
  const token = getAuthToken(req, "access")
  if (!token) return { error: jsonError("Unauthorized", 401) }
  try {
    const decoded = verifyToken<any>(token, "access")
    return { decoded }
  } catch {
    return { error: jsonError("Unauthorized", 401) }
  }
}

export async function GET(req: NextRequest) {
  const mm = requireMethod(req, ["GET"])
  if (mm) return mm

  const { decoded, error } = await authenticate(req)
  if (error) return error

  await connectToDatabase()
  const user = await User.findById(decoded!.sub)
    .select("verified verification_status verification_message verification_requested_at verification_reviewed_at verification_documents")
    .lean()

  if (!user) return jsonError("User not found", 404)

  return jsonOk({
    status: user.verification_status || (user.verified ? "verified" : "none"),
    verified: user.verified,
    message: user.verification_message || "",
    requestedAt: user.verification_requested_at,
    reviewedAt: user.verification_reviewed_at,
    documents: user.verification_documents || [],
  })
}

export async function POST(req: NextRequest) {
  const mm = requireMethod(req, ["POST"])
  if (mm) return mm

  const { decoded, error } = await authenticate(req)
  if (error) return error

  await connectToDatabase()
  const user = await User.findById(decoded!.sub)
  if (!user) return jsonError("User not found", 404)

  if (user.verified) {
    return jsonError("You are already verified.", 400)
  }

  if (user.verification_status === "pending") {
    return jsonError("Verification already requested.", 400)
  }

  const body = await req.json().catch(() => ({}))
  const message = typeof body?.message === "string" ? body.message.trim() : ""
  const documents = Array.isArray(body?.documents)
    ? body.documents.filter((doc: any) => typeof doc === "string" && doc.trim().length > 0).slice(0, 5)
    : []

  user.verification_status = "pending"
  user.verification_message = message
  user.verification_documents = documents
  user.verification_requested_at = new Date()
  user.verification_reviewed_at = undefined
  // Explicitly ensure verified flag is false until approval
  user.verified = false

  await user.save()

  return jsonOk({
    status: user.verification_status,
    message: user.verification_message,
    requestedAt: user.verification_requested_at,
  })
}

