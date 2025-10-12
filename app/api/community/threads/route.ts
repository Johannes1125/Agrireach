import { NextRequest } from "next/server"
import { connectToDatabase } from "@/server/lib/mongodb"
import { Thread, ThreadCategory } from "@/server/models/Thread"
import { User } from "@/server/models/User"
import { jsonOk, jsonError, requireMethod, getAuthToken } from "@/server/utils/api"
import { verifyToken } from "@/server/utils/auth"
import { validateBody } from "@/server/middleware/validate"
import { CreateThreadSchema } from "@/server/validators/threadSchemas"
import { validateUserRole } from "@/server/utils/role-validation";

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
    Thread.find(filter)
      .populate('author_id', 'full_name avatar_url role')
      .sort({ pinned: -1, last_activity: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Thread.countDocuments(filter),
  ])

  // Format items to match frontend expectations
  const formattedItems = items.map((item: any) => ({
    ...item,
    author: item.author_id ? {
      name: item.author_id.full_name || 'User',
      avatar: item.author_id.avatar_url || '',
      role: item.author_id.role || 'Member'
    } : {
      name: 'User',
      avatar: '',
      role: 'Member'
    }
  }))

  return jsonOk({ items: formattedItems, total, page, pages: Math.ceil(total / limit) })
}

export async function POST(req: NextRequest) {
  const mm = requireMethod(req, ["POST"])
  if (mm) return mm
  
  // Validate user is authenticated (any role can post threads)
  let userId: string;
  try {
    const { user, userId: validatedUserId } = await validateUserRole(req, ["worker", "recruiter", "buyer"]);
    userId = validatedUserId;
  } catch (error: any) {
    return jsonError(error.message, 403);
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
      author_id: userId,
      likes_count: 0,
      replies_count: 0,
      views: 0
    }

    const thread = await Thread.create(threadData)
    
    // Get author info for notification
    const author = await User.findById(userId).select("full_name").lean();
    const authorName = author?.full_name || "A user";
    
    // Notify all users about new community thread (don't await to avoid slowing down the response)
    notifyAllUsersNewThread(authorName, result.data.title, thread._id.toString()).catch(err => 
      console.error("Failed to send thread notifications:", err)
    );
    
    return jsonOk({ id: thread._id })
  } catch (error) {
    console.error("Thread creation error:", error)
    return jsonError(error instanceof Error ? error.message : "Failed to create thread", 500)
  }
}


