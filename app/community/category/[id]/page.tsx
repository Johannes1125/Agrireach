"use client"

import { useState } from "react"
import { ArrowLeft, MessageSquare, Eye, ThumbsUp, Pin, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"

// Mock category data
const categoryData = {
  1: {
    name: "Farming Tips & Techniques",
    description: "Share knowledge about crop cultivation, soil management, and farming best practices",
    icon: "🌱",
  },
}

// Mock threads data
const threads = [
  {
    id: 1,
    title: "Organic pest control methods that actually work",
    author: {
      name: "John Farmer",
      avatar: "/placeholder.svg?key=jf123",
      role: "Experienced Farmer",
    },
    createdAt: "2 hours ago",
    replies: 23,
    views: 156,
    likes: 12,
    isPinned: true,
    lastReply: {
      author: "Sarah Green",
      time: "30 minutes ago",
    },
    tags: ["organic", "pest-control", "natural-methods"],
  },
  {
    id: 2,
    title: "Best soil preparation techniques for the rainy season",
    author: {
      name: "Mike Soil",
      avatar: "/placeholder.svg?key=ms456",
      role: "Soil Expert",
    },
    createdAt: "5 hours ago",
    replies: 18,
    views: 89,
    likes: 8,
    isPinned: false,
    lastReply: {
      author: "David Farm",
      time: "1 hour ago",
    },
    tags: ["soil", "preparation", "rainy-season"],
  },
  {
    id: 3,
    title: "Companion planting guide for vegetables",
    author: {
      name: "Lisa Garden",
      avatar: "/placeholder.svg?key=lg789",
      role: "Garden Specialist",
    },
    createdAt: "1 day ago",
    replies: 31,
    views: 234,
    likes: 19,
    isPinned: false,
    lastReply: {
      author: "Tom Plant",
      time: "3 hours ago",
    },
    tags: ["companion-planting", "vegetables", "garden"],
  },
  {
    id: 4,
    title: "Water conservation techniques for dry regions",
    author: {
      name: "Ahmed Water",
      avatar: "/placeholder.svg?key=aw012",
      role: "Water Management",
    },
    createdAt: "2 days ago",
    replies: 15,
    views: 167,
    likes: 14,
    isPinned: false,
    lastReply: {
      author: "Maria Save",
      time: "5 hours ago",
    },
    tags: ["water-conservation", "drought", "irrigation"],
  },
]

export default function CategoryPage({ params }: { params: { id: string } }) {
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState("recent")

  const categoryId = Number.parseInt(params.id)
  const category = categoryData[categoryId as keyof typeof categoryData] || categoryData[1]

  const filteredThreads = threads
    .filter(
      (thread) =>
        thread.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        thread.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase())),
    )
    .sort((a, b) => {
      switch (sortBy) {
        case "popular":
          return b.likes - a.likes
        case "replies":
          return b.replies - a.replies
        case "views":
          return b.views - a.views
        default:
          return 0 // recent - would use actual dates
      }
    })

  // Separate pinned and regular threads
  const pinnedThreads = filteredThreads.filter((thread) => thread.isPinned)
  const regularThreads = filteredThreads.filter((thread) => !thread.isPinned)

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
              <div className="text-3xl">{category.icon}</div>
              <div>
                <h1 className="text-2xl font-bold text-foreground font-sans">{category.name}</h1>
                <p className="text-muted-foreground">{category.description}</p>
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
                <ThreadCard key={thread.id} thread={thread} isPinned />
              ))}
            </div>
          </div>
        )}

        {/* Regular Threads */}
        <div className="space-y-3">
          {regularThreads.map((thread) => (
            <ThreadCard key={thread.id} thread={thread} />
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
            <AvatarImage src={thread.author.avatar || "/placeholder.svg"} />
            <AvatarFallback>{thread.author.name[0]}</AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <Link href={`/community/thread/${thread.id}`}>
                <h3 className="text-lg font-semibold hover:text-primary cursor-pointer line-clamp-2">
                  {isPinned && <Pin className="inline h-4 w-4 mr-1 text-primary" />}
                  {thread.title}
                </h3>
              </Link>
            </div>

            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
              <span>
                by <span className="font-medium">{thread.author.name}</span>
              </span>
              <Badge variant="outline" className="text-xs">
                {thread.author.role}
              </Badge>
              <span>{thread.createdAt}</span>
            </div>

            <div className="flex flex-wrap gap-2 mb-3">
              {thread.tags.map((tag: string, index: number) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <MessageSquare className="h-4 w-4" />
                  <span>{thread.replies} replies</span>
                </div>
                <div className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  <span>{thread.views} views</span>
                </div>
                <div className="flex items-center gap-1">
                  <ThumbsUp className="h-4 w-4" />
                  <span>{thread.likes} likes</span>
                </div>
              </div>

              <div className="text-sm text-muted-foreground">
                <span>Last reply by </span>
                <span className="font-medium">{thread.lastReply.author}</span>
                <span> {thread.lastReply.time}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
s