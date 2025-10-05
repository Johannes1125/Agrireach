import { NextRequest } from "next/server"
import { connectToDatabase } from "@/server/lib/mongodb"
import { Thread, ThreadCategory } from "@/server/models/Thread"
import { jsonOk, jsonError, requireMethod, getAuthToken } from "@/server/utils/api"
import { verifyToken } from "@/server/utils/auth"
import { validateBody } from "@/server/middleware/validate"
import { CreateThreadSchema } from "@/server/validators/threadSchemas"

export async function GET(req: NextRequest) {
  const mm = requireMethod(req, ["GET"])
  if (mm) return mm
  await connectToDatabase()
  const url = new URL(req.url)
  const q = url.searchParams
  const filter: any = {}
  if (q.get("category_id")) {
    const cid = q.get("category_id") as string
    const isObjectId = /^[a-fA-F0-9]{24}$/.test(cid)
    if (isObjectId) {
      // First try to find by category_id (ObjectId reference)
      filter.category_id = cid
    } else {
      // treat as category name - search both category field and by looking up category_id
      const cat = await ThreadCategory.findOne({ name: cid }).lean()
      if (cat) {
        filter.$or = [
          { category: cid },
          { category_id: cat._id }
        ]
      } else {
        filter.category = cid
      }
    }
  }
  if (q.get("status")) filter.status = q.get("status")
  if (q.get("q")) filter.$text = { $search: q.get("q") as string }
  const page = parseInt(q.get("page") || "1", 10)
  const limit = Math.min(parseInt(q.get("limit") || "20", 10), 100)
  const skip = (page - 1) * limit

  const [items, total] = await Promise.all([
    Thread.find(filter).sort({ pinned: -1, last_activity: -1 }).skip(skip).limit(limit).lean(),
    Thread.countDocuments(filter),
  ])

  return jsonOk({ items, total, page, pages: Math.ceil(total / limit) })
}

export async function POST(req: NextRequest) {
  const mm = requireMethod(req, ["POST"])
  if (mm) return mm
  const token = getAuthToken(req, "access")
  if (!token) return jsonError("Unauthorized", 401)
  let decoded: any
  try {
    decoded = verifyToken<any>(token, "access")
  } catch {
    return jsonError("Unauthorized", 401)
  }
  const validate = validateBody(CreateThreadSchema)
  const result = await validate(req)
  if (!result.ok) {
    console.error("Validation failed:", result.res)
    return result.res
  }
  await connectToDatabase()



  try {
    // Handle category conversion: if category name is provided, find or create the category
    let category_id = result.data.category_id
    if (!category_id && result.data.category) {
      // Try to find existing category by name
      let category = await ThreadCategory.findOne({ name: result.data.category })
      if (!category) {
        // Create new category if it doesn't exist
        category = await ThreadCategory.create({
          name: result.data.category,
          slug: result.data.category.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          posts_count: 0
        })
      }
      category_id = category._id.toString()
    }

    // Ensure we have a category_id
    if (!category_id) {
      return jsonError("Category is required", 400)
    }

    // Create thread with proper category_id
    const threadData = {
      title: result.data.title,
      content: result.data.content,
      tags: result.data.tags,
      category_id,
      author_id: decoded.sub,
      likes_count: 0,
      replies_count: 0,
      views: 0
    }

    const thread = await Thread.create(threadData)
    return jsonOk({ id: thread._id })
  } catch (error) {
    console.error("Thread creation error:", error)
    return jsonError(error instanceof Error ? error.message : "Failed to create thread", 500)
  }
}


