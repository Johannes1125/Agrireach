"use client";

import { useEffect, useState, use as usePromise } from "react";
import {
  ArrowLeft,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Share2,
  Flag,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { authFetch } from "@/lib/auth-client";
import { formatRelativeTime } from "@/lib/utils";

interface ThreadData {
  _id: string;
  title: string;
  content: string;
  tags?: string[];
  author?: {
    name?: string;
    avatar?: string;
    role?: string;
    posts?: number;
    reputation?: number;
  };
  created_at?: string;
  likes_count?: number;
  category?: string;
}
interface ReplyData {
  _id: string;
  content: string;
  author_id?: string;
  author?: {
    name?: string;
    avatar?: string;
    role?: string;
    posts?: number;
    _id?: string;
  };
  created_at?: string;
  likes_count?: number;
  isEditing?: boolean;
}

export default function ThreadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = usePromise(params);
  const [newReply, setNewReply] = useState("");
  const [userLikes, setUserLikes] = useState<{
    [key: string]: "like" | "dislike" | null;
  }>({});
  const [threadData, setThreadData] = useState<ThreadData | null>(null);
  const [replies, setReplies] = useState<ReplyData[]>([]);
  const [editReplyId, setEditReplyId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [currentUser, setCurrentUser] = useState<{
    _id: string;
    name: string;
  } | null>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportContentId, setReportContentId] = useState("");

  useEffect(() => {
    const load = async () => {
      const [tres, pres, ures] = await Promise.all([
        fetch(`/api/community/threads/${id}`),
        fetch(`/api/community/threads/${id}/posts`),
        authFetch("/api/users/me").catch(() => null),
      ]);
      const tjson = await tres.json().catch(() => ({}));
      const pjson = await pres.json().catch(() => ({}));
      if (tres.ok) setThreadData(tjson?.data || null);
      if (pres.ok) setReplies(pjson?.data?.items || []);

      // Try to get current user info
      if (ures && ures.ok) {
        const ujson = await ures.json().catch(() => ({}));
        if (ujson?.data) {
          setCurrentUser({
            _id: ujson.data._id,
            name: ujson.data.full_name || ujson.data.name || "Me",
          });
        }
      }
    };
    load();
  }, [id]);

  const handleVote = async (postId: string, voteType: "like" | "dislike") => {
    setUserLikes((prev) => ({
      ...prev,
      [postId]: prev[postId] === voteType ? null : voteType,
    }));
    try {
      if (postId === "main") {
        const res = await authFetch(`/api/community/threads/${id}/vote`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ vote_type: voteType }),
        });
        const json = await res.json().catch(() => ({}));
        if (res.ok)
          setThreadData((t) =>
            t
              ? { ...t, likes_count: json?.data?.likes_count ?? t.likes_count }
              : t
          );
      } else {
        const res = await authFetch(`/api/community/posts/${postId}/vote`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ vote_type: voteType }),
        });
        const json = await res.json().catch(() => ({}));
        if (res.ok)
          setReplies((rs) =>
            rs.map((r: any) =>
              String(r._id) === String(postId)
                ? {
                    ...r,
                    likes_count: json?.data?.likes_count ?? r.likes_count,
                  }
                : r
            )
          );
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleReply = () => {
    const run = async () => {
      if (!newReply.trim()) return;
      try {
        const res = await authFetch(`/api/community/threads/${id}/posts`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: newReply }),
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json?.message || "Failed to post reply");
        setNewReply("");
        // reload replies
        const pres = await fetch(`/api/community/threads/${id}/posts`);
        const pjson = await pres.json().catch(() => ({}));
        if (pres.ok) setReplies(pjson?.data?.items || []);
        toast.success("Reply posted successfully");
      } catch (e: any) {
        console.error(e);
        toast.error(e?.message || "Failed to post reply");
      }
    };
    run();
  };

  const handleEditReply = (replyId: string, content: string) => {
    setEditReplyId(replyId);
    setEditContent(content);
  };

  const cancelEdit = () => {
    setEditReplyId(null);
    setEditContent("");
  };

  const saveEdit = async (replyId: string) => {
    if (!editContent.trim()) return;
    try {
      const res = await authFetch(`/api/community/posts/${replyId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editContent }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.message || "Failed to update reply");

      // Update replies locally
      setReplies(
        replies.map((r) =>
          r._id === replyId ? { ...r, content: editContent } : r
        )
      );
      cancelEdit();
      toast.success("Reply updated successfully");
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Failed to update reply");
    }
  };

  const deleteReply = async (replyId: string) => {
    if (!confirm("Are you sure you want to delete this reply?")) return;
    try {
      const res = await authFetch(`/api/community/posts/${replyId}`, {
        method: "DELETE",
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.message || "Failed to delete reply");

      // Update replies locally
      setReplies(replies.filter((r) => r._id !== replyId));
      toast.success("Reply deleted successfully");
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Failed to delete reply");
    }
  };

  const handleReportReply = (contentId: string) => {
    setReportContentId(contentId);
    setReportOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <Link
            href="/community"
            className="inline-flex items-center text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Threads
          </Link>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Original Post */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage
                    src={threadData?.author?.avatar || "/placeholder.svg"}
                  />
                  <AvatarFallback>
                    {(threadData?.author?.name || "")[0] || "?"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h1 className="text-2xl font-bold text-foreground font-sans mb-1">
                    {threadData?.title || "Thread"}
                  </h1>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="font-medium">
                      {threadData?.author?.name || "User"}
                    </span>
                    <Badge 
                      className={
                        threadData?.author?.role === "admin" 
                          ? "bg-red-50 text-red-700 border-red-200 font-medium"
                          : threadData?.author?.role === "worker"
                          ? "bg-blue-50 text-blue-700 border-blue-200 font-medium"
                          : threadData?.author?.role === "buyer"
                          ? "bg-green-50 text-green-700 border-green-200 font-medium"
                          : threadData?.author?.role === "recruiter"
                          ? "bg-purple-50 text-purple-700 border-purple-200 font-medium"
                          : "bg-gray-50 text-gray-700 border-gray-200 font-medium"
                      }
                      variant="secondary"
                    >
                      {threadData?.author?.role === "admin" && "👑 "}
                      {threadData?.author?.role === "worker" && "🔧 "}
                      {threadData?.author?.role === "buyer" && "🛒 "}
                      {threadData?.author?.role === "recruiter" && "💼 "}
                      {threadData?.author?.role || "Member"}
                    </Badge>
                    <span>•</span>
                    <span>{threadData?.created_at ? formatRelativeTime(threadData.created_at) : ""}</span>
                  </div>
                </div>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem>
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleReportReply(id)}>
                    <Flag className="h-4 w-4 mr-2" />
                    Report
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>

          <CardContent>
            <div className="prose prose-sm max-w-none mb-4">
              {(threadData?.content || "")
                .split("\n")
                .map((paragraph, index) => (
                  <p key={index} className="mb-3 leading-relaxed">
                    {paragraph.startsWith("**") && paragraph.endsWith("**") ? (
                      <strong>{paragraph.slice(2, -2)}</strong>
                    ) : (
                      paragraph
                    )}
                  </p>
                ))}
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              {(threadData?.tags || []).map((tag, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Button
                    variant={userLikes["main"] === "like" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => handleVote("main", "like")}
                  >
                    <ThumbsUp className="h-4 w-4 mr-1" />
                    {(threadData?.likes_count || 0) +
                      (userLikes["main"] === "like" ? 1 : 0)}
                  </Button>
                  <Button
                    variant={
                      userLikes["main"] === "dislike" ? "default" : "ghost"
                    }
                    size="sm"
                    onClick={() => handleVote("main", "dislike")}
                  >
                    <ThumbsDown className="h-4 w-4 mr-1" />
                    {0 + (userLikes["main"] === "dislike" ? 1 : 0)}
                  </Button>
                </div>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <MessageSquare className="h-4 w-4" />
                  <span>{replies.length} replies</span>
                </div>
              </div>

              <div className="text-sm text-muted-foreground">
                <p>
                  {threadData?.author?.posts || 0} posts •{" "}
                  {threadData?.author?.reputation || 0} reputation
                </p>
                <p>{""}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Replies */}
        <div className="space-y-4 mb-6">
          <h2 className="text-xl font-semibold">Replies ({replies.length})</h2>

          {[...replies]
            .sort(
              (a, b) =>
                new Date(b.created_at || "").getTime() -
                new Date(a.created_at || "").getTime()
            )
            .map((reply: any) => (
              <Card key={reply._id}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-10 w-10">
                      <AvatarImage
                        src={reply.author?.avatar || "/placeholder.svg"}
                      />
                      <AvatarFallback>
                        {(reply.author?.name || "")[0] || "?"}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {reply.author?.name || "User"}
                          </span>
                          <Badge 
                            className={
                              reply.author?.role === "admin" 
                                ? "bg-red-50 text-red-700 border-red-200 font-medium text-xs"
                                : reply.author?.role === "worker"
                                ? "bg-blue-50 text-blue-700 border-blue-200 font-medium text-xs"
                                : reply.author?.role === "buyer"
                                ? "bg-green-50 text-green-700 border-green-200 font-medium text-xs"
                                : reply.author?.role === "recruiter"
                                ? "bg-purple-50 text-purple-700 border-purple-200 font-medium text-xs"
                                : "bg-gray-50 text-gray-700 border-gray-200 font-medium text-xs"
                            }
                            variant="secondary"
                          >
                            {reply.author?.role === "admin" && "👑 "}
                            {reply.author?.role === "worker" && "🔧 "}
                            {reply.author?.role === "buyer" && "🛒 "}
                            {reply.author?.role === "recruiter" && "💼 "}
                            {reply.author?.role || "Member"}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            •
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {reply.created_at ? formatRelativeTime(reply.created_at) : ""}
                          </span>
                        </div>

                        {/* Comment actions dropdown */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {/* Only show edit/delete to comment owner */}
                            {currentUser &&
                              (reply.author?._id === currentUser._id ||
                                reply.author_id === currentUser._id) && (
                                <>
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleEditReply(reply._id, reply.content)
                                    }
                                  >
                                    <Pencil className="h-4 w-4 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => deleteReply(reply._id)}
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </>
                              )}
                            {/* Report option for everyone */}
                            <DropdownMenuItem
                              onClick={() => handleReportReply(reply._id)}
                            >
                              <Flag className="h-4 w-4 mr-2" />
                              Report
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      {editReplyId === reply._id ? (
                        <div className="mb-3">
                          <Textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            rows={3}
                            className="mb-2"
                          />
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={cancelEdit}
                            >
                              Cancel
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => saveEdit(reply._id)}
                            >
                              Save
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm leading-relaxed mb-3">
                          {reply.content}
                        </p>
                      )}

                      <div className="flex items-center gap-2">
                        <Button
                          variant={
                            userLikes[reply._id] === "like"
                              ? "default"
                              : "ghost"
                          }
                          size="sm"
                          onClick={() => handleVote(String(reply._id), "like")}
                        >
                          <ThumbsUp className="h-3 w-3 mr-1" />
                          {(reply.likes_count || 0) +
                            (userLikes[reply._id] === "like" ? 1 : 0)}
                        </Button>
                        <Button
                          variant={
                            userLikes[reply._id] === "dislike"
                              ? "default"
                              : "ghost"
                          }
                          size="sm"
                          onClick={() =>
                            handleVote(String(reply._id), "dislike")
                          }
                        >
                          <ThumbsDown className="h-3 w-3 mr-1" />
                          {0 + (userLikes[reply._id] === "dislike" ? 1 : 0)}
                        </Button>
                        <Button variant="ghost" size="sm">
                          Reply
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>

        {/* Reply Form */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Add Your Reply</h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Textarea
                placeholder="Share your thoughts, experiences, or ask questions..."
                value={newReply}
                onChange={(e) => setNewReply(e.target.value)}
                rows={4}
              />
              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">
                  Be respectful and constructive in your responses
                </p>
                <Button onClick={handleReply} disabled={!newReply.trim()}>
                  Post Reply
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        {/* Report Dialog */}
        {reportOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h3 className="text-lg font-semibold mb-4">
                {reportContentId === id ? "Report Thread" : "Report Comment"}
              </h3>

              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  const reason = formData.get("reportReason") as string;
                  const description = formData.get(
                    "reportDescription"
                  ) as string;

                  if (!reason) {
                    toast.error("Please select a reason for reporting");
                    return;
                  }

                  // Check if this is a thread report or a reply report
                  const isThreadReport = reportContentId === id;

                  let reportedUser;

                  if (isThreadReport) {
                    reportedUser = threadData?.author;
                  } else {
                    // It's a reply report
                    const reportedReply = replies.find(
                      (r) => r._id === reportContentId
                    );
                    reportedUser = reportedReply?.author;
                  }

                  // Generate a simpler payload without complex types
                  const reportPayload = {
                    type: "forum_post",
                    content_id: reportContentId,
                    reason: reason,
                    description: description || reason,
                  };

                  // Only add reported_user_id if we can find it
                  if (reportedUser?._id) {
                    Object.assign(reportPayload, {
                      reported_user_id: reportedUser._id.toString(),
                    });
                  } else if (!isThreadReport) {
                    // For reply, try the author_id field directly if available
                    const reportedReply = replies.find(
                      (r) => r._id === reportContentId
                    );
                    if (reportedReply?.author_id) {
                      Object.assign(reportPayload, {
                        reported_user_id: reportedReply.author_id.toString(),
                      });
                    }
                  }
                  try {
                    console.log("Sending report data:", reportPayload);

                    const res = await authFetch("/api/reports", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(reportPayload),
                    });

                    let json;
                    try {
                      json = await res.json();
                      console.log("Report API response:", json);
                    } catch (err) {
                      console.error("Failed to parse JSON response:", err);
                      json = {};
                    }

                    if (!res.ok) {
                      throw new Error(
                        (json && json.message) ||
                          `Failed to submit report (${res.status})`
                      );
                    }

                    toast.success("Report submitted successfully");
                    setReportOpen(false);
                  } catch (error: any) {
                    console.error("Error submitting report:", error);

                    // Show more detailed error message based on the error type
                    if (
                      error.name === "TypeError" &&
                      error.message.includes("collection")
                    ) {
                      toast.error(
                        "Server error: Database connection issue. Please try again later."
                      );
                    } else if (
                      error.message.includes("Unauthorized") ||
                      error.message.includes("401")
                    ) {
                      toast.error(
                        "Authentication error: Please log in again to report this comment."
                      );
                    } else if (
                      error.message.includes(
                        "Argument passed in does not match"
                      )
                    ) {
                      toast.error(
                        "Error: Invalid ID format in the report. Please try again."
                      );
                    } else {
                      toast.error(error.message || "Failed to submit report");
                    }
                  }
                }}
                className="space-y-3"
              >
                <div className="flex flex-col gap-2">
                  {[
                    "Spam",
                    "Harassment",
                    "Inappropriate content",
                    "Misinformation",
                    "Others",
                  ].map((reasonOption) => (
                    <label
                      key={reasonOption}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="reportReason"
                        value={reasonOption}
                        className="accent-primary"
                        required
                      />
                      <span>{reasonOption}</span>
                    </label>
                  ))}
                </div>

                <Textarea
                  name="reportDescription"
                  placeholder="Additional details about the issue (optional)"
                  rows={3}
                />

                <div className="flex justify-end gap-2 mt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setReportOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">Submit</Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
