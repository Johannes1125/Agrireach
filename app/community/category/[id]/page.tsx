"use client"

import { useEffect, useState, use as usePromise } from "react"
import { ArrowLeft, MessageSquare, Eye, ThumbsUp, Pin, Search, Plus, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ContentLoader } from "@/components/ui/content-loader"
import { formatRelativeTime } from "@/lib/utils"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface ThreadItem { 
  _id: string; 
  title: string; 
  tags?: string[]; 
  replies_count?: number; 
  views?: number; 
  likes_count?: number; 
  author_id?: string; 
  created_at?: string; 
  pinned?: boolean;
  author?: {
    name?: string;
    avatar?: string;
    role?: string;
  };
  lastReply?: {
    author?: string;
    time?: string;
  };
}

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
      const [results] = await Promise.all([
        Promise.all([
          fetch(`/api/community/categories/${id}`).then(res => res.json().catch(() => ({}))),
          fetch(`/api/community/threads?category_id=${encodeURIComponent(id)}`).then(res => res.json().catch(() => ({}))),
        ]),
        new Promise(resolve => setTimeout(resolve, 500))
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
          return 0
      }
    })

  // Separate pinned and regular threads
  const pinnedThreads = filteredThreads.filter((thread: any) => thread.pinned)
  const regularThreads = filteredThreads.filter((thread: any) => !thread.pinned)

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <ContentLoader text="Loading category..." />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Enhanced Header */}
      <div className="bg-gradient-to-br from-primary/5 via-background to-primary/10 border-b">
        <div className="container mx-auto px-3 sm:px-4 md:px-6 py-6 sm:py-8">
          <Link 
            href="/community" 
            className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-4 sm:mb-6 transition-colors group"
          >
            <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            Back to Forums
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-primary/10">
                <MessageSquare className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-heading font-bold text-foreground">
                  {category?.name || "Category"}
                </h1>
                {category?.description && (
                  <p className="text-sm sm:text-base text-muted-foreground mt-2">
                    {category.description}
                  </p>
                )}
              </div>
            </div>
            <Link href="/community/new-thread">
              <Button size="lg" className="w-full sm:w-auto bg-primary hover:bg-primary/90 shadow-md hover:shadow-lg transition-all">
                <Plus className="h-4 w-4 mr-2" />
                Start New Thread
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-3 sm:px-4 md:px-6 py-6 sm:py-8">
        {/* Enhanced Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6 sm:mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
            <Input
              placeholder="Search threads..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 h-12 text-base bg-card border-2 focus:border-primary/50 transition-colors"
            />
          </div>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full sm:w-48 h-12">
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
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Pin className="h-5 w-5 text-primary" />
              <h2 className="text-lg sm:text-xl font-heading font-bold text-foreground">
                Pinned Threads
              </h2>
            </div>
            <div className="space-y-4">
              {pinnedThreads.map((thread) => (
                <ThreadCard key={thread._id} thread={thread} isPinned />
              ))}
            </div>
          </div>
        )}

        {/* Regular Threads */}
        <div className="space-y-4">
          {pinnedThreads.length > 0 && (
            <h2 className="text-lg sm:text-xl font-heading font-bold text-foreground mb-4">
              All Threads
            </h2>
          )}
          {regularThreads.length > 0 ? (
            regularThreads.map((thread) => (
              <ThreadCard key={thread._id} thread={thread} />
            ))
          ) : filteredThreads.length === 0 ? (
            <Card>
              <CardContent className="py-12 sm:py-16 text-center">
                <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground text-sm sm:text-base">
                  No threads found matching your criteria.
                </p>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function ThreadCard({ thread, isPinned = false }: { thread: ThreadItem; isPinned?: boolean }) {
  const getRoleBadgeStyle = (role?: string) => {
    switch (role) {
      case "admin":
        return "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20"
      case "worker":
        return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
      case "buyer":
        return "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20"
      case "recruiter":
        return "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20"
      default:
        return "bg-muted text-muted-foreground border-border"
    }
  }

  return (
    <Link href={`/community/thread/${thread._id || thread._id}`}>
      <Card className={cn(
        "group hover:shadow-lg hover:border-primary/50 transition-all duration-300 cursor-pointer",
        isPinned && "border-primary/30 bg-primary/5"
      )}>
        <CardContent className="p-5 sm:p-6">
          <div className="flex items-start gap-4">
            <Avatar className="h-10 w-10 sm:h-12 sm:w-12 border-2 border-border group-hover:border-primary/50 transition-colors flex-shrink-0">
              <AvatarImage src={thread.author?.avatar || "/placeholder.svg"} />
              <AvatarFallback className="text-sm">
                {(thread.author?.name || "U")[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4 mb-3">
                <h3 className="text-base sm:text-lg font-heading font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2 flex-1">
                  {isPinned && (
                    <Pin className="inline h-4 w-4 mr-2 text-primary" />
                  )}
                  {thread.title}
                </h3>
                <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all flex-shrink-0 mt-1" />
              </div>

              <div className="flex items-center gap-3 flex-wrap mb-3">
                <span className="text-xs sm:text-sm text-muted-foreground">
                  by <span className="font-medium text-foreground">{thread.author?.name || "User"}</span>
                </span>
                {thread.author?.role && (
                  <Badge 
                    variant="outline" 
                    className={cn("text-xs font-medium", getRoleBadgeStyle(thread.author.role))}
                  >
                    {thread.author.role}
                  </Badge>
                )}
                {thread.created_at && (
                  <span className="text-xs sm:text-sm text-muted-foreground">
                    {formatRelativeTime(thread.created_at)}
                  </span>
                )}
              </div>

              {thread.tags && thread.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {thread.tags.map((tag: string, index: number) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-4 text-xs sm:text-sm text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <MessageSquare className="h-4 w-4" />
                    <span className="font-medium">{thread.replies_count || 0}</span>
                    <span>replies</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Eye className="h-4 w-4" />
                    <span className="font-medium">{thread.views || 0}</span>
                    <span>views</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <ThumbsUp className="h-4 w-4" />
                    <span className="font-medium">{thread.likes_count || 0}</span>
                    <span>likes</span>
                  </div>
                </div>

                {thread.lastReply && (
                  <div className="text-xs sm:text-sm text-muted-foreground">
                    <span>Last reply by </span>
                    <span className="font-medium text-foreground">{thread.lastReply.author}</span>
                    {thread.lastReply.time && (
                      <span> {thread.lastReply.time}</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
