"use client"

import { useEffect, useState, use as usePromise } from "react"
import { ArrowLeft, ThumbsUp, ThumbsDown, MessageSquare, Share2, Flag, MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import Link from "next/link"

interface ThreadData {
  _id: string
  title: string
  content: string
  tags?: string[]
  author?: { name?: string; avatar?: string; role?: string; posts?: number; reputation?: number }
  created_at?: string
  likes_count?: number
  category?: string
}
interface ReplyData {
  _id: string
  content: string
  author?: { name?: string; avatar?: string; role?: string; posts?: number }
  created_at?: string
  likes_count?: number
}

export default function ThreadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = usePromise(params)
  const [newReply, setNewReply] = useState("")
  const [userLikes, setUserLikes] = useState<{ [key: string]: "like" | "dislike" | null }>({})
  const [threadData, setThreadData] = useState<ThreadData | null>(null)
  const [replies, setReplies] = useState<ReplyData[]>([])

  useEffect(() => {
    const load = async () => {
      const [tres, pres] = await Promise.all([
        fetch(`/api/community/threads/${id}`),
        fetch(`/api/community/threads/${id}/posts`),
      ])
      const tjson = await tres.json().catch(() => ({}))
      const pjson = await pres.json().catch(() => ({}))
      if (tres.ok) setThreadData(tjson?.data || null)
      if (pres.ok) setReplies(pjson?.data?.items || [])
    }
    load()
  }, [id])

  const handleVote = async (postId: string, voteType: "like" | "dislike") => {
    setUserLikes((prev) => ({ ...prev, [postId]: prev[postId] === voteType ? null : voteType }))
    try {
      if (postId === "main") {
        const res = await fetch(`/api/community/threads/${id}/vote`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ vote_type: voteType }),
        })
        const json = await res.json().catch(() => ({}))
        if (res.ok) setThreadData((t) => (t ? { ...t, likes_count: json?.data?.likes_count ?? t.likes_count } : t))
      } else {
        const res = await fetch(`/api/community/posts/${postId}/vote`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ vote_type: voteType }),
        })
        const json = await res.json().catch(() => ({}))
        if (res.ok) setReplies((rs) => rs.map((r: any) => (String(r._id) === String(postId) ? { ...r, likes_count: json?.data?.likes_count ?? r.likes_count } : r)))
      }
    } catch (e) {
      console.error(e)
    }
  }

  const handleReply = () => {
    const run = async () => {
      if (!newReply.trim()) return
      try {
        const res = await fetch(`/api/community/threads/${id}/posts`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: newReply }),
        })
        const json = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(json?.message || "Failed to post reply")
        setNewReply("")
        // reload replies
        const pres = await fetch(`/api/community/threads/${id}/posts`)
        const pjson = await pres.json().catch(() => ({}))
        if (pres.ok) setReplies(pjson?.data?.items || [])
      } catch (e) {
        console.error(e)
      }
    }
    run()
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <Link href="/community" className="inline-flex items-center text-muted-foreground hover:text-foreground">
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
                  <AvatarImage src={threadData?.author?.avatar || "/placeholder.svg"} />
                  <AvatarFallback>{(threadData?.author?.name || "")[0] || "?"}</AvatarFallback>
                </Avatar>
                <div>
                  <h1 className="text-2xl font-bold text-foreground font-sans mb-1">{threadData?.title || "Thread"}</h1>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="font-medium">{threadData?.author?.name || "User"}</span>
                    <Badge variant="outline">{threadData?.author?.role || "Member"}</Badge>
                    <span>•</span>
                    <span>{threadData?.created_at || ""}</span>
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
                  <DropdownMenuItem>
                    <Flag className="h-4 w-4 mr-2" />
                    Report
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>

          <CardContent>
            <div className="prose prose-sm max-w-none mb-4">
              {(threadData?.content || "").split("\n").map((paragraph, index) => (
                <p key={index} className="mb-3 leading-relaxed">
                  {paragraph.startsWith("**") && paragraph.endsWith("**") ? <strong>{paragraph.slice(2, -2)}</strong> : paragraph}
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
                    {(threadData?.likes_count || 0) + (userLikes["main"] === "like" ? 1 : 0)}
                  </Button>
                  <Button
                    variant={userLikes["main"] === "dislike" ? "default" : "ghost"}
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
                  {(threadData?.author?.posts || 0)} posts • {(threadData?.author?.reputation || 0)} reputation
                </p>
                <p>{""}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Replies */}
        <div className="space-y-4 mb-6">
          <h2 className="text-xl font-semibold">Replies ({replies.length})</h2>

          {replies.map((reply: any) => (
            <Card key={reply._id}>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={reply.author?.avatar || "/placeholder.svg"} />
                    <AvatarFallback>{(reply.author?.name || "")[0] || "?"}</AvatarFallback>
                  </Avatar>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium">{reply.author?.name || "User"}</span>
                      <Badge variant="outline" className="text-xs">
                        {reply.author?.role || "Member"}
                      </Badge>
                      <span className="text-sm text-muted-foreground">•</span>
                      <span className="text-sm text-muted-foreground">{reply.created_at || ""}</span>
                    </div>

                    <p className="text-sm leading-relaxed mb-3">{reply.content}</p>

                    <div className="flex items-center gap-2">
                      <Button
                        variant={userLikes[reply._id] === "like" ? "default" : "ghost"}
                        size="sm"
                        onClick={() => handleVote(String(reply._id), "like")}
                      >
                        <ThumbsUp className="h-3 w-3 mr-1" />
                        {(reply.likes_count || 0) + (userLikes[reply._id] === "like" ? 1 : 0)}
                      </Button>
                      <Button
                        variant={userLikes[reply._id] === "dislike" ? "default" : "ghost"}
                        size="sm"
                        onClick={() => handleVote(String(reply._id), "dislike")}
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
                <p className="text-sm text-muted-foreground">Be respectful and constructive in your responses</p>
                <Button onClick={handleReply} disabled={!newReply.trim()}>
                  Post Reply
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
