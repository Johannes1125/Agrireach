import { NextRequest } from "next/server"
import { jsonOk, jsonError, getAuthToken } from "@/server/utils/api"
import { verifyToken } from "@/server/utils/auth"
import { connectToDatabase } from "@/server/lib/mongodb"
import { UserProfile } from "@/server/models/UserProfile"

export async function GET(req: NextRequest) {
  const token = getAuthToken(req, "access")
  if (!token) return jsonError("Unauthorized", 401)
  let decoded: any
  try {
    decoded = verifyToken<any>(token, "access")
  } catch {
    return jsonError("Unauthorized", 401)
  }

  await connectToDatabase()
  const profile = await UserProfile.findOne({ user_id: decoded.sub }).lean()
  return jsonOk({ profile: profile || null })
}

export async function PUT(req: NextRequest) {
  const token = getAuthToken(req, "access")
  if (!token) return jsonError("Unauthorized", 401)
  let decoded: any
  try {
    decoded = verifyToken<any>(token, "access")
  } catch {
    return jsonError("Unauthorized", 401)
  }

  await connectToDatabase()
  const body = await req.json().catch(() => ({}))

  const update: any = {
    company_name: body?.company_name,
    industry: body?.industry,
    business_type: body?.business_type,
    company_size: body?.company_size,
    business_description: body?.business_description,
    business_address: body?.business_address,
    business_registration: body?.business_registration,
    business_hours: body?.business_hours,
    website: body?.website,
    business_logo: body?.business_logo,
    years_in_business: body?.years_in_business,
    services_offered: Array.isArray(body?.services_offered) ? body.services_offered : undefined,
    skills: Array.isArray(body?.skills) ? body.skills : undefined,
    phone: body?.phone,
  }

  Object.keys(update).forEach((k) => update[k] === undefined && delete update[k])

  const profile = await UserProfile.findOneAndUpdate(
    { user_id: decoded.sub },
    { $set: { ...update, user_id: decoded.sub } },
    { new: true, upsert: true }
  )

  return jsonOk({ profile })
}


