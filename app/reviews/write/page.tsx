"use client";

import { useEffect, useState } from "react";
import { authFetch } from "@/lib/auth-client";
import { toast } from "sonner";
import { ArrowLeft, Star, Package, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { RouteGuard } from "@/components/auth/route-guard";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import Link from "next/link";

// Mock data for users to review
// const availableUsers = [
//   {
//     id: 1,
//     name: "Green Valley Farm",
//     avatar: "/placeholder.svg?key=gvf123",
//     role: "Seller",
//     type: "product",
//     recentTransaction: "Organic Tomatoes - Order #1234",
//   },
//   {
//     id: 2,
//     name: "John Worker",
//     avatar: "/placeholder.svg?key=jw456",
//     role: "Worker",
//     type: "service",
//     recentTransaction: "Harvesting Job - Contract #5678",
//   },
//   {
//     id: 3,
//     name: "Artisan Crafts Co.",
//     avatar: "/placeholder.svg?key=acc789",
//     role: "Seller",
//     type: "product",
//     recentTransaction: "Handwoven Baskets - Order #9012",
//   },
// ];

const reviewCategories = {
  product: [
    "Product Quality",
    "Delivery",
    "Communication",
    "Value for Money",
    "Packaging",
  ],
  service: [
    "Work Quality",
    "Punctuality",
    "Communication",
    "Professionalism",
    "Value for Money",
  ],
};

export default function WriteReviewPage() {
  return (
    <RouteGuard requireAuth>
      <WriteReviewPageContent />
    </RouteGuard>
  );
}

function WriteReviewPageContent() {
  const router = useRouter();
  const [selectedUser, setSelectedUser] = useState("");
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    category: "",
    wouldRecommend: "",
  });
  const [reviewees, setReviewees] = useState<
    Array<{ _id: string; name: string; type: "recruiter" | "seller" }>
  >([]);
  const [loadingReviewees, setLoadingReviewees] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoadingReviewees(true);
      try {
        const res = await authFetch("/api/reviews/reviewees");
        if (!res.ok) throw new Error("Failed to load review options");
        const json = await res.json();
        setReviewees(
          Array.isArray(json?.data?.reviewees)
            ? json.data.reviewees
            : json.reviewees || []
        );
      } catch (e) {
        setReviewees([]);
      } finally {
        setLoadingReviewees(false);
      }
    };
    load();
  }, []);

  const selectedUserData = reviewees.find((user) => user._id === selectedUser);
  const categories = selectedUserData
    ? reviewCategories[selectedUserData.type as keyof typeof reviewCategories]
    : [];

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedUser) {
      toast.error("Please select a user to review");
      return;
    }

    if (rating === 0) {
      toast.error("Please provide a rating");
      return;
    }

    try {
      setSubmitting(true);

      const selected = reviewees.find((x) => x._id === selectedUser);
      const res = await authFetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // reviewee_id: selectedUser, // real ObjectId from API above
          // reviewee_name: selected?.name, // optional
          reviewee_id: selectedUser,
          reviewee_name: selected?.name,
          rating,
          title: formData.title || undefined,
          comment: formData.content || undefined,
          category: formData.category || undefined,
        }),
      });

      if (!res.ok) {
        const contentType = res.headers.get("content-type") || "";
        let msg = `Failed to submit review (HTTP ${res.status})`;
        try {
          msg = contentType.includes("application/json")
            ? (await res.json())?.message || msg
            : (await res.text()) || msg;
        } catch {}
        throw new Error(msg);
      }

      const json = await res.json().catch(() => null);
      // optimistic + refetch signal
      if (json?.review) {
        try {
          sessionStorage.setItem(
            "reviews:optimistic",
            JSON.stringify(json.review)
          );
        } catch {}
      }
      window.dispatchEvent(new CustomEvent("reviews:updated"));
      toast.success("Review submitted successfully!");
      router.push("/reviews");
    } catch (error: any) {
      toast.error(error.message || "Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-white border-b dark:bg-black dark:border-black">
        <div className="container mx-auto px-4 py-4">
          <Link
            href="/reviews"
            className="inline-flex items-center text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Reviews
          </Link>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground font-sans mb-2">
            Write a Review
          </h1>
          <p className="text-muted-foreground">
            Share your experience to help build trust in our community
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Select User to Review */}
          <Card>
            <CardHeader>
              <CardTitle>Who are you reviewing?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {/* {reviewees.map((user) => (
                  <div
                    key={user._id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedUser === user._id
                        ? "border-primary bg-primary/5"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    onClick={() => setSelectedUser(user._id)}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={user.avatar || "/placeholder.svg"} />
                        <AvatarFallback>{user.name[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">
                            {user.name || "User"}
                          </h3>
                          <Badge variant="outline">{user.role}</Badge>
                          {user.type === "product" ? (
                            <Package className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Briefcase className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {user.recentTransaction}
                        </p>
                      </div>
                    </div>
                  </div>
                ))} */}
                <Select value={selectedUser} onValueChange={setSelectedUser}>
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        loadingReviewees
                          ? "Loading..."
                          : "Select person/company"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {reviewees.map((r) => (
                      <SelectItem key={r._id} value={r._id}>
                        {r.name}{" "}
                        {r.type === "seller" ? "(Seller)" : "(Recruiter)"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {selectedUserData && (
            <>
              {/* Rating */}
              <Card>
                <CardHeader>
                  <CardTitle>Overall Rating</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 mb-4">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        className="focus:outline-none"
                        title={`Rate ${star} star${star > 1 ? "s" : ""}`}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        onClick={() => setRating(star)}
                      >
                        <Star
                          className={`h-8 w-8 transition-colors ${
                            star <= (hoverRating || rating)
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-gray-300 hover:text-yellow-200"
                          }`}
                        />
                      </button>
                    ))}
                    <span className="ml-2 text-lg font-medium">
                      {rating > 0 &&
                        (rating === 5
                          ? "Excellent"
                          : rating === 4
                          ? "Good"
                          : rating === 3
                          ? "Average"
                          : rating === 2
                          ? "Poor"
                          : "Very Poor")}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Click the stars to rate your experience with{" "}
                    {selectedUserData.name}
                  </p>
                </CardContent>
              </Card>

              {/* Review Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Review Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) =>
                        handleInputChange("category", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="title">Review Title</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) =>
                        handleInputChange("title", e.target.value)
                      }
                      placeholder="Summarize your experience in a few words"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="content">Your Review</Label>
                    <Textarea
                      id="content"
                      value={formData.content}
                      onChange={(e) =>
                        handleInputChange("content", e.target.value)
                      }
                      placeholder="Share details about your experience. What went well? What could be improved?"
                      rows={6}
                      required
                    />
                    <p className="text-sm text-muted-foreground">
                      Be specific and honest. Your review helps others make
                      informed decisions.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <Label>
                      Would you recommend {selectedUserData.name} to others?
                    </Label>
                    <RadioGroup
                      value={formData.wouldRecommend}
                      onValueChange={(value) =>
                        handleInputChange("wouldRecommend", value)
                      }
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="yes" id="recommend-yes" />
                        <Label htmlFor="recommend-yes">
                          Yes, I would recommend them
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="no" id="recommend-no" />
                        <Label htmlFor="recommend-no">
                          No, I would not recommend them
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="maybe" id="recommend-maybe" />
                        <Label htmlFor="recommend-maybe">
                          Maybe, with some reservations
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>
                </CardContent>
              </Card>

              {/* Review Guidelines */}
              <Card>
                <CardHeader>
                  <CardTitle>Review Guidelines</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Be honest and fair in your assessment</li>
                    <li>
                      • Focus on your actual experience with the person or
                      product
                    </li>
                    <li>• Avoid personal attacks or inappropriate language</li>
                    <li>
                      • Include specific details that would help other users
                    </li>
                    <li>
                      • Reviews are public and will be associated with your
                      profile
                    </li>
                  </ul>
                </CardContent>
              </Card>

              {/* Submit */}
              <div className="flex gap-4">
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={
                    !rating ||
                    !formData.title ||
                    !formData.content ||
                    !formData.category ||
                    submitting
                  }
                >
                  {submitting ? "Submitting..." : "Submit Review"}
                </Button>
                <Button type="button" variant="outline">
                  Save as Draft
                </Button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
