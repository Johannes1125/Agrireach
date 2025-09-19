"use client"

import { useState } from "react"
import { ArrowLeft, ThumbsUp, ThumbsDown, MessageSquare, Share2, Flag, MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import Link from "next/link"

// Mock thread data
const threadData = {
  id: 1,
  title: "Organic pest control methods that actually work",
  content: `I've been farming organically for over 10 years and wanted to share some pest control methods that have consistently worked for me. These are all natural, safe for the environment, and won't harm beneficial insects.

**1. Neem Oil Spray**
Mix 2 tablespoons of neem oil with 1 gallon of water and a few drops of dish soap. This works great against aphids, whiteflies, and spider mites. Apply in the evening to avoid harming bees.

**2. Companion Planting**
Planting marigolds, basil, and nasturtiums around your crops can naturally repel many pests. I've seen a significant reduction in pest problems since implementing this.

**3. Diatomaceous Earth**
Food-grade diatomaceous earth is excellent for controlling crawling insects. Sprinkle it around the base of plants, but reapply after rain.

**4. Beneficial Insects**
Encourage ladybugs, lacewings, and parasitic wasps by planting flowers like yarrow, dill, and fennel. These natural predators will help control pest populations.

Has anyone else tried these methods? What has worked best for you?`,
  author: {
    name: "John Farmer",
    avatar: "/placeholder.svg?key=jf123",
    role: "Experienced Farmer",
    joinDate: "Member since 2020",
    posts: 234,
    reputation: 892,
  },
  createdAt: "2 hours ago",
  likes: 12,
  dislikes: 1,
  tags: ["organic", "pest-control", "natural-methods"],
  category: "Farming Tips & Techniques",
}

// Mock replies data
const replies = [
  {
    id: 1,
    content:
      "Great tips! I've been using neem oil for the past season and it's been incredibly effective against aphids on my tomatoes. The key is consistency - I spray every 7-10 days as a preventive measure.",
    author: {
      name: "Sarah Green",
      avatar: "/placeholder.svg?key=sg456",
      role: "Organic Gardener",
      posts: 89,
    },
    createdAt: "1 hour ago",
    likes: 5,
    dislikes: 0,
  },
  {
    id: 2,
    content:
      "I'd like to add that row covers can also be very effective, especially for protecting young plants from flying pests. They're reusable and completely chemical-free.",
    author: {
      name: "Mike Protection",
      avatar: "/placeholder.svg?key=mp789",
      role: "Sustainable Farmer",
      posts: 156,
    },
    createdAt: "45 minutes ago",
    likes: 3,
    dislikes: 0,
  },
  {
    id: 3,
    content:
      "Has anyone tried using essential oils like peppermint or rosemary? I've heard they can be effective but haven't tested them myself.",
    author: {
      name: "Lisa Natural",
      avatar: "/placeholder.svg?key=ln012",
      role: "New Farmer",
      posts: 23,
    },
    createdAt: "30 minutes ago",
    likes: 2,
    dislikes: 0,
  },
]

export default function ThreadPage({ params }: { params: { id: string } }) {
  const [newReply, setNewReply] = useState("")
  const [userLikes, setUserLikes] = useState<{ [key: string]: "like" | "dislike" | null }>({})

  const handleVote = (postId: string, voteType: "like" | "dislike") => {
    setUserLikes((prev) => ({
      ...prev,
      [postId]: prev[postId] === voteType ? null : voteType,
    }))
  }

  const handleReply = () => {
    if (newReply.trim()) {
      // Handle reply submission
      console.log("New reply:", newReply)
      setNewReply("")
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <Link
            href="/community/category/1"
            className="inline-flex items-center text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to {threadData.category}
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
                  <AvatarImage src={threadData.author.avatar || "/placeholder.svg"} />
                  <AvatarFallback>{threadData.author.name[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <h1 className="text-2xl font-bold text-foreground font-sans mb-1">{threadData.title}</h1>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="font-medium">{threadData.author.name}</span>
                    <Badge variant="outline">{threadData.author.role}</Badge>
                    <span>•</span>
                    <span>{threadData.createdAt}</span>
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
              {threadData.content.split("\n").map((paragraph, index) => (
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
              {threadData.tags.map((tag, index) => (
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
                    {threadData.likes + (userLikes["main"] === "like" ? 1 : 0)}
                  </Button>
                  <Button
                    variant={userLikes["main"] === "dislike" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => handleVote("main", "dislike")}
                  >
                    <ThumbsDown className="h-4 w-4 mr-1" />
                    {threadData.dislikes + (userLikes["main"] === "dislike" ? 1 : 0)}
                  </Button>
                </div>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <MessageSquare className="h-4 w-4" />
                  <span>{replies.length} replies</span>
                </div>
              </div>

              <div className="text-sm text-muted-foreground">
                <p>
                  {threadData.author.posts} posts • {threadData.author.reputation} reputation
                </p>
                <p>{threadData.author.joinDate}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Replies */}
        <div className="space-y-4 mb-6">
          <h2 className="text-xl font-semibold">Replies ({replies.length})</h2>

          {replies.map((reply, index) => (
            <Card key={reply.id}>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={reply.author.avatar || "/placeholder.svg"} />
                    <AvatarFallback>{reply.author.name[0]}</AvatarFallback>
                  </Avatar>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium">{reply.author.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {reply.author.role}
                      </Badge>
                      <span className="text-sm text-muted-foreground">•</span>
                      <span className="text-sm text-muted-foreground">{reply.createdAt}</span>
                    </div>

                    <p className="text-sm leading-relaxed mb-3">{reply.content}</p>

                    <div className="flex items-center gap-2">
                      <Button
                        variant={userLikes[reply.id] === "like" ? "default" : "ghost"}
                        size="sm"
                        onClick={() => handleVote(reply.id.toString(), "like")}
                      >
                        <ThumbsUp className="h-3 w-3 mr-1" />
                        {reply.likes + (userLikes[reply.id] === "like" ? 1 : 0)}
                      </Button>
                      <Button
                        variant={userLikes[reply.id] === "dislike" ? "default" : "ghost"}
                        size="sm"
                        onClick={() => handleVote(reply.id.toString(), "dislike")}
                      >
                        <ThumbsDown className="h-3 w-3 mr-1" />
                        {reply.dislikes + (userLikes[reply.id] === "dislike" ? 1 : 0)}
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
