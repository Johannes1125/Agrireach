"use client"

import { useEffect, useState, use as usePromise } from "react"
import { ArrowLeft, MessageSquare, Eye, ThumbsUp, Pin, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { InlineLoader } from "@/components/ui/page-loader"
import { formatRelativeTime } from "@/lib/utils"
import Link from "next/link"

interface ThreadItem { _id: string; title: string; tags?: string[]; replies_count?: number; views?: number; likes_count?: number; author_id?: string; created_at?: string; pinned?: boolean }

export default function CategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = usePromise(params)
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState("recent")
  const [category, setCategory] = useState<any>(null)
  const [threads, setThreads] = useState<ThreadItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      // Add minimum delay for loading state
      const [results] = await Promise.all([
        Promise.all([
          fetch(`/api/community/categories/${id}`).then(res => res.json().catch(() => ({}))),
          fetch(`/api/community/threads?category_id=${encodeURIComponent(id)}`).then(res => res.json().catch(() => ({}))),
        ]),
        new Promise(resolve => setTimeout(resolve, 2000)) // Minimum 2 second delay
      ])
      const [cjson, tjson] = results
      if (cjson?.data) setCategory(cjson.data)
      if (tjson?.data?.items) setThreads(tjson.data.items)
      setLoading(false)
    }
    load()
  }, [id])

  const filteredThreads = (threads || [])
    .filter(
      (thread: any) =>
        (thread.title || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (thread.tags || []).some((tag: string) => tag.toLowerCase().includes(searchTerm.toLowerCase())),
    )
    .sort((a, b) => {
      switch (sortBy) {
        case "popular":
          return (b.likes_count || 0) - (a.likes_count || 0)
        case "replies":
          return (b.replies_count || 0) - (a.replies_count || 0)
        case "views":
          return (b.views || 0) - (a.views || 0)
        default:
          return 0 // recent - would use actual dates
      }
    })

  // Separate pinned and regular threads
  const pinnedThreads = filteredThreads.filter((thread: any) => thread.pinned)
  const regularThreads = filteredThreads.filter((thread: any) => !thread.pinned)

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container px-4 py-8">
          <div className="flex items-center justify-center min-h-[600px]">
            <InlineLoader text="Loading category..." variant="spinner" size="lg" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <Link href="/community" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Forums
          </Link>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-3">
              <div className="text-3xl">{category?.icon || "💬"}</div>
              <div>
                <h1 className="text-2xl font-bold text-foreground font-sans">{category?.name || "Category"}</h1>
                <p className="text-muted-foreground">{category?.description}</p>
              </div>
            </div>
            <Link href="/community/new-thread">
              <Button className="bg-primary hover:bg-primary/90">Start New Thread</Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search threads..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Most Recent</SelectItem>
              <SelectItem value="popular">Most Popular</SelectItem>
              <SelectItem value="replies">Most Replies</SelectItem>
              <SelectItem value="views">Most Views</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Pinned Threads */}
        {pinnedThreads.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Pin className="h-4 w-4" />
              Pinned Threads
            </h2>
            <div className="space-y-3">
              {pinnedThreads.map((thread) => (
                <ThreadCard key={thread._id} thread={thread} isPinned />
              ))}
            </div>
          </div>
        )}

        {/* Regular Threads */}
        <div className="space-y-3">
          {regularThreads.map((thread) => (
            <ThreadCard key={thread._id} thread={thread} />
          ))}
        </div>

        {filteredThreads.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No threads found matching your criteria.</p>
          </div>
        )}
      </div>
    </div>
  )
}

function ThreadCard({ thread, isPinned = false }: { thread: any; isPinned?: boolean }) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <Avatar className="h-10 w-10">
            <AvatarImage src={thread.author?.avatar || "/placeholder.svg"} />
            <AvatarFallback>{(thread.author?.name || "")[0] || "?"}</AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <Link href={`/community/thread/${thread._id || thread.id}`}>
                <h3 className="text-lg font-semibold hover:text-primary cursor-pointer line-clamp-2">
                  {isPinned && <Pin className="inline h-4 w-4 mr-1 text-primary" />}
                  {thread.title}
                </h3>
              </Link>
            </div>

            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
              <span>
                by <span className="font-medium">{thread.author?.name || "User"}</span>
              </span>
              <Badge 
                className={
                  thread.author?.role === "admin" 
                    ? "bg-red-50 text-red-700 border-red-200 font-medium text-xs"
                    : thread.author?.role === "worker"
                    ? "bg-blue-50 text-blue-700 border-blue-200 font-medium text-xs"
                    : thread.author?.role === "buyer"
                    ? "bg-green-50 text-green-700 border-green-200 font-medium text-xs"
                    : thread.author?.role === "recruiter"
                    ? "bg-purple-50 text-purple-700 border-purple-200 font-medium text-xs"
                    : "bg-gray-50 text-gray-700 border-gray-200 font-medium text-xs"
                }
                variant="secondary"
              >
                {thread.author?.role === "admin" && "👑 "}
                {thread.author?.role === "worker" && "🔧 "}
                {thread.author?.role === "buyer" && "🛒 "}
                {thread.author?.role === "recruiter" && "💼 "}
                {thread.author?.role || "Member"}
              </Badge>
              <span>{thread.created_at ? formatRelativeTime(thread.created_at) : ""}</span>
            </div>

            <div className="flex flex-wrap gap-2 mb-3">
              {(thread.tags || []).map((tag: string, index: number) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <MessageSquare className="h-4 w-4" />
                  <span>{thread.replies_count || 0} replies</span>
                </div>
                <div className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  <span>{thread.views || 0} views</span>
                </div>
                <div className="flex items-center gap-1">
                  <ThumbsUp className="h-4 w-4" />
                  <span>{thread.likes_count || 0} likes</span>
                </div>
              </div>

              {thread.lastReply && (
                <div className="text-sm text-muted-foreground">
                  <span>Last reply by </span>
                  <span className="font-medium">{thread.lastReply.author}</span>
                  <span> {thread.lastReply.time}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
