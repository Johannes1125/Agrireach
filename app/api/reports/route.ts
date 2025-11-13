import { NextRequest } from "next/server";
import { connectToDatabase } from "@/server/lib/mongodb";
import { Report } from "@/server/models/Report";
import {
  jsonOk,
  jsonError,
  requireMethod,
  getAuthToken,
} from "@/server/utils/api";
import { verifyToken } from "@/server/utils/auth";
import mongoose from "mongoose";

export async function POST(req: NextRequest) {
  const mm = requireMethod(req, ["POST"]);
  if (mm) return mm;

  const token = getAuthToken(req, "access");
  if (!token) return jsonError("Unauthorized", 401);

  let decoded: any;
  try {
    decoded = verifyToken<any>(token, "access");
  } catch {
    return jsonError("Unauthorized", 401);
  }

  try {
    await connectToDatabase();

    const body = await req.json();
    console.log("Report request body:", body);

    const { type, content_id, reason, description, reported_user_id } = body;

    // Validate required fields
    if (!type || !reason || !description || !content_id) {
      return jsonError("Missing required fields", 400);
    }

    // Validate type
    if (!["user", "forum_post", "thread", "product", "review"].includes(type)) {
      return jsonError("Invalid report type", 400);
    }

    // Just create a raw document object without trying to cast ObjectIds
    const reportDoc = {
      reporter_id: decoded.sub,
      type,
      content_id,
      reason,
      description,
      status: "pending",
      priority: "medium",
    };

    // Only add reported_user_id if provided
    if (reported_user_id) {
      Object.assign(reportDoc, { reported_user_id });
    }

    // Insert directly into the collection to avoid schema validation
    const result = await mongoose.connection.collection("reports").insertOne({
      ...reportDoc,
      created_at: new Date(),
      updated_at: new Date(),
    });

    console.log("Report created:", result);

    return jsonOk({ report_id: result.insertedId });
  } catch (error: any) {
    console.error("Error creating report:", error);
    return jsonError(error.message || "Failed to submit report", 500);
  }
}

export async function GET(req: NextRequest) {
  const mm = requireMethod(req, ["GET"]);
  if (mm) return mm;

  const token = getAuthToken(req, "access");
  if (!token) return jsonError("Unauthorized", 401);

  let decoded: any;
  try {
    decoded = verifyToken<any>(token, "access");
  } catch {
    return jsonError("Unauthorized", 401);
  }

  // Only admin users should be able to see all reports
  if (!decoded.role || !["admin", "moderator"].includes(decoded.role)) {
    return jsonError("Forbidden", 403);
  }

  try {
    await connectToDatabase();

    const searchParams = new URL(req.url).searchParams;
    const type = searchParams.get("type");
    const status = searchParams.get("status");
    const limit = Number(searchParams.get("limit")) || 50;
    const skip = Number(searchParams.get("skip")) || 0;

    const query: any = {};
    if (type) query.type = type;
    if (status) query.status = status;

    // Use the reports collection directly
    const collection = mongoose.connection.collection("reports");
    const reports = await collection
      .find(query)
      .sort({ created_at: -1 })
      .limit(limit)
      .skip(skip)
      .toArray();

    const total = await collection.countDocuments(query);

    return jsonOk({
      items: reports,
      total,
      limit,
      skip,
    });
  } catch (error: any) {
    console.error("Error fetching reports:", error);
    return jsonError(error.message || "Failed to fetch reports", 500);
  }
}
