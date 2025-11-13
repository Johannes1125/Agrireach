import { NextRequest } from "next/server"
import { requireMethod, jsonError, jsonOk, getAuthToken } from "@/server/utils/api"
import { verifyToken } from "@/server/utils/auth"
import { connectToDatabase } from "@/server/lib/mongodb"
import { Report } from "@/server/models/Report"
import { Thread, ThreadReply } from "@/server/models/Thread"
import { Product } from "@/server/models/Product"
import { Review } from "@/server/models/Review"

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

  try {
    const [items, total] = await Promise.all([
      Report.find(filter)
        .populate({
          path: 'reporter_id',
          select: 'full_name email avatar_url role',
          options: { strictPopulate: false }
        })
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Report.countDocuments(filter)
    ])

    // Format the reports for frontend consumption
    const formattedReports = items.map((report: any) => {
      // Handle reporter info
      const reporter = report.reporter_id && typeof report.reporter_id === 'object' ? {
        full_name: report.reporter_id.full_name || 'Unknown',
        email: report.reporter_id.email || '',
        avatar_url: report.reporter_id.avatar_url || '',
        role: report.reporter_id.role || 'user'
      } : { full_name: 'Unknown', email: '', avatar_url: '', role: 'user' }

      return {
        ...report,
        reporter,
        createdAt: report.created_at ? new Date(report.created_at).toLocaleString() : '',
        id: String(report._id)
      }
    })

    return jsonOk({ reports: formattedReports, total, page, pages: Math.ceil(total / limit) })
  } catch (error) {
    console.error('Error fetching reports:', error)
    return jsonError('Failed to fetch reports', 500, error instanceof Error ? error.message : 'Unknown error')
  }
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
  
  // Get the report first to know what content to delete
  const report = await Report.findById(id)
  if (!report) return jsonError('Report not found', 404)

  let set: any = {}
  
  if (action === 'resolve') {
    // Delete the reported content based on type
    try {
      if (report.content_id) {
        switch (report.type) {
          case 'forum_post':
            // Delete the forum post/thread reply
            await ThreadReply.findByIdAndDelete(report.content_id)
            break
          case 'thread':
            // Delete the entire thread
            await Thread.findByIdAndDelete(report.content_id)
            break
          case 'product':
            // Delete the product
            await Product.findByIdAndDelete(report.content_id)
            break
          case 'review':
            // Delete the review
            await Review.findByIdAndDelete(report.content_id)
            break
          default:
            console.log(`Unknown content type: ${report.type}`)
        }
      }
    } catch (error) {
      console.error('Error deleting content:', error)
      // Continue to mark as resolved even if deletion fails
    }
    
    set = { 
      status: 'resolved', 
      resolution: resolution || 'Content removed by admin',
      resolved_by: decoded.sub,
      resolved_at: new Date()
    }
  } else if (action === 'dismiss') {
    // Just dismiss the report, don't delete content
    set = { 
      status: 'dismissed', 
      resolution: resolution || 'Report dismissed as not valid',
      resolved_by: decoded.sub,
      resolved_at: new Date()
    }
  } else {
    return jsonError('Invalid action', 400)
  }

  const updated = await Report.findByIdAndUpdate(id, { $set: set }, { new: true })
  return jsonOk({ report: updated })
}
