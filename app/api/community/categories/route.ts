import { NextRequest } from "next/server";
import { connectToDatabase } from "@/server/lib/mongodb";
import { ThreadCategory, Thread } from "@/server/models/Thread";
import { jsonOk, requireMethod } from "@/server/utils/api";

export async function GET(_req: NextRequest) {
  const mm = requireMethod(_req, ["GET"]);
  if (mm) return mm;
  await connectToDatabase();
  // Inferred categories from threads by name
  const names: string[] = await Thread.distinct("category", { category: { $exists: true, $ne: null } });
  const inferred = await Promise.all(
    names.map(async (name) => {
      const posts_count = await Thread.countDocuments({ category: name });
      return { name, posts_count } as any;
    })
  );

  // Explicit categories that actually have threads (by category_id or matching name)
  const explicit = await ThreadCategory.find().sort({ name: 1 }).lean();
  const explicitWithPosts: any[] = [];
  for (const it of explicit) {
    const posts_count = await Thread.countDocuments({ $or: [{ category_id: it._id }, { category: it.name }] });
    if (posts_count > 0) explicitWithPosts.push({ ...it, posts_count });
  }

  // Merge inferred and explicit (with posts) by lowercased name
  const map = new Map<string, any>();
  for (const it of inferred) {
    map.set(String(it.name).toLowerCase(), it);
  }
  for (const it of explicitWithPosts) {
    map.set(String(it.name).toLowerCase(), it);
  }
  const items = Array.from(map.values());
  return jsonOk({ items });
}


