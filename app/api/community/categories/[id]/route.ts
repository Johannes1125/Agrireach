import { NextRequest } from "next/server";
import { connectToDatabase } from "@/server/lib/mongodb";
import { ThreadCategory, Thread } from "@/server/models/Thread";
import { jsonOk, jsonError, requireMethod } from "@/server/utils/api";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const mm = requireMethod(_req, ["GET"]);
  if (mm) return mm;
  await connectToDatabase();

  const { id } = await params;

  // Support both explicit category by ObjectId and inferred categories by name
  let cat: any = null;
  const isObjectId = /^[a-fA-F0-9]{24}$/.test(id);
  if (isObjectId) {
    cat = await ThreadCategory.findById(id).lean();
    if (!cat) return jsonError("Not found", 404);
    const posts_count = await Thread.countDocuments({ $or: [{ category_id: id }, { category: cat.name }] });
    return jsonOk({ ...cat, posts_count });
  }
  // Treat :id as category name slug
  const name = decodeURIComponent(id);
  const posts_count = await Thread.countDocuments({ category: name });
  return jsonOk({ name, posts_count, icon: "💬" });
}


