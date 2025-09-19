"use client"

import { useState } from "react"
import { MessageSquare, Users, TrendingUp, Clock, Search, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { SimpleHeader } from "@/components/layout/simple-header"
import Link from "next/link"

// Mock forum data
const forumCategories = [
  {
    id: 1,
    name: "Farming Tips & Techniques",
    description: "Share knowledge about crop cultivation, soil management, and farming best practices",
    icon: "🌱",
    threads: 156,
    posts: 892,
    lastPost: {
      title: "Organic pest control methods",
      author: "John Farmer",
      time: "2 hours ago",
    },
  },
  {
    id: 2,
    name: "Market Discussions",
    description: "Discuss market prices, trends, and trading opportunities",
    icon: "📈",
    threads: 89,
    posts: 445,
    lastPost: {
      title: "Tomato prices rising this season",
      author: "Sarah Market",
      time: "4 hours ago",
    },
  },
  {
    id: 3,
    name: "Equipment & Tools",
    description: "Reviews, recommendations, and discussions about farming equipment",
    icon: "🚜",
    threads: 67,
    posts: 234,
    lastPost: {
      title: "Best irrigation systems for small farms",
      author: "Mike Tools",
      time: "6 hours ago",
    },
  },
  {
    id: 4,
    name: "Weather & Seasons",
    description: "Weather updates, seasonal planning, and climate discussions",
    icon: "🌤️",
    threads: 45,
    posts: 178,
    lastPost: {
      title: "Preparing for the rainy season",
      author: "Weather Watch",
      time: "1 day ago",
    },
  },
  {
    id: 5,
    name: "Success Stories",
    description: "Share your farming successes and inspire others",
    icon: "🏆",
    threads: 34,
    posts: 156,
    lastPost: {
      title: "My first successful organic harvest",
      author: "Happy Farmer",
      time: "2 days ago",
    },
  },
  {
    id: 6,
    name: "General Discussion",
    description: "Open discussions about rural life and community topics",
    icon: "💬",
    threads: 78,
    posts: 312,
    lastPost: {
      title: "Community market day organization",
      author: "Community Leader",
      time: "3 days ago",
    },
  },
]

const trendingTopics = [
  { title: "Drought-resistant crops for 2024", replies: 23, category: "Farming Tips" },
  { title: "New government subsidies available", replies: 18, category: "Market Discussions" },
  { title: "Solar-powered irrigation systems", replies: 15, category: "Equipment & Tools" },
  { title: "Climate change adaptation strategies", replies: 12, category: "Weather & Seasons" },
]

const recentActivity = [
  {
    user: "John Farmer",
    action: "replied to",
    topic: "Organic pest control methods",
    time: "2 hours ago",
    avatar: "/placeholder.svg?key=jf123",
  },
  {
    user: "Sarah Market",
    action: "started",
    topic: "Tomato prices rising this season",
    time: "4 hours ago",
    avatar: "/placeholder.svg?key=sm456",
  },
  {
    user: "Mike Tools",
    action: "replied to",
    topic: "Best irrigation systems for small farms",
    time: "6 hours ago",
    avatar: "/placeholder.svg?key=mt789",
  },
]

export default function CommunityPage() {
  const [searchTerm, setSearchTerm] = useState("")

  const filteredCategories = forumCategories.filter(
    (category) =>
      category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      category.description.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="min-h-screen bg-background">
      <SimpleHeader />

      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground font-sans">Community Forums</h1>
              <p className="text-muted-foreground mt-1">Connect, share knowledge, and grow together</p>
            </div>
            <Link href="/community/new-thread">
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="h-4 w-4 mr-2" />
                New Discussion
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search forums..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Forum Categories */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Forum Categories</h2>
              <div className="space-y-3">
                {filteredCategories.map((category) => (
                  <Card key={category.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="text-3xl">{category.icon}</div>
                        <div className="flex-1 min-w-0">
                          <Link href={`/community/category/${category.id}`}>
                            <h3 className="text-lg font-semibold hover:text-primary cursor-pointer">{category.name}</h3>
                          </Link>
                          <p className="text-muted-foreground text-sm mt-1">{category.description}</p>

                          <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <MessageSquare className="h-4 w-4" />
                              <span>{category.threads} threads</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Users className="h-4 w-4" />
                              <span>{category.posts} posts</span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right text-sm">
                          <p className="font-medium">{category.lastPost.title}</p>
                          <p className="text-muted-foreground">by {category.lastPost.author}</p>
                          <p className="text-muted-foreground">{category.lastPost.time}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Community Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Community Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm">Total Members</span>
                  <span className="font-semibold">2,847</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Total Threads</span>
                  <span className="font-semibold">469</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Total Posts</span>
                  <span className="font-semibold">2,217</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Online Now</span>
                  <span className="font-semibold text-green-600">156</span>
                </div>
              </CardContent>
            </Card>

            {/* Trending Topics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Trending Topics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {trendingTopics.map((topic, index) => (
                  <div key={index} className="space-y-1">
                    <Link href="#" className="text-sm font-medium hover:text-primary line-clamp-2">
                      {topic.title}
                    </Link>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="outline" className="text-xs">
                        {topic.category}
                      </Badge>
                      <span>{topic.replies} replies</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={activity.avatar || "/placeholder.svg"} />
                      <AvatarFallback>{activity.user[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">
                        <span className="font-medium">{activity.user}</span>
                        <span className="text-muted-foreground"> {activity.action} </span>
                        <Link href="#" className="hover:text-primary line-clamp-1">
                          {activity.topic}
                        </Link>
                      </p>
                      <p className="text-xs text-muted-foreground">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
