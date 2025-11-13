import { NextRequest } from "next/server";
import { requireMethod, jsonError, jsonOk, getAuthToken } from "@/server/utils/api";
import { verifyToken } from "@/server/utils/auth";
import { connectToDatabase } from "@/server/lib/mongodb";
import { Review, ReviewVote } from "@/server/models/Review";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const mm = requireMethod(req, ["POST"]);
  if (mm) return mm;

  const { id } = await params;
  const token = getAuthToken(req, "access");
  if (!token) return jsonError("Unauthorized", 401);

  let decoded: any;
  try {
    decoded = verifyToken<any>(token, "access");
  } catch {
    return jsonError("Unauthorized", 401);
  }

  await connectToDatabase();
  
  // Check if review exists
  const review = await Review.findById(id);
  if (!review) return jsonError("Review not found", 404);

  // Check if user is trying to vote on their own review
  if (review.reviewer_id.toString() === decoded.sub) {
    return jsonError("Cannot vote on your own review", 400);
  }

  // Check if user has already voted
  const existingVote = await ReviewVote.findOne({
    review_id: id,
    user_id: decoded.sub
  });

  if (existingVote) {
    if (existingVote.vote_type === "helpful") {
      // Remove helpful vote
      await ReviewVote.findByIdAndDelete(existingVote._id);
      await Review.findByIdAndUpdate(id, {
        $inc: { helpful_count: -1 }
      });
      return jsonOk({ message: "Helpful vote removed" });
    } else {
      // Change from not_helpful to helpful
      await ReviewVote.findByIdAndUpdate(existingVote._id, {
        $set: { vote_type: "helpful" }
      });
      await Review.findByIdAndUpdate(id, {
        $inc: { helpful_count: 1 }
      });
      return jsonOk({ message: "Vote changed to helpful" });
    }
  } else {
    // Create new helpful vote
    await ReviewVote.create({
      review_id: id,
      user_id: decoded.sub,
      vote_type: "helpful"
    });

    await Review.findByIdAndUpdate(id, {
      $inc: { helpful_count: 1 }
    });

    return jsonOk({ message: "Review marked as helpful" });
  }
}
