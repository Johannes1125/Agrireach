import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  MessageSquare,
  Users,
  AlertTriangle,
  CheckCircle,
  Pin,
  Lock,
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

export default function CommunityContentPage() {
  // Mock data for community posts
  const posts = [
    {
      id: "1",
      title: "Best practices for organic soil management",
      author: "Maria Rodriguez",
      category: "Farming Tips",
      replies: 23,
      views: 456,
      likes: 34,
      status: "active",
      pinned: true,
      flagged: false,
      createdAt: "2024-02-20",
      lastActivity: "2024-02-22",
    },
    {
      id: "2",
      title: "Seasonal worker housing recommendations",
      author: "John Smith",
      category: "Worker Resources",
      replies: 12,
      views: 234,
      likes: 18,
      status: "active",
      pinned: false,
      flagged: false,
      createdAt: "2024-02-18",
      lastActivity: "2024-02-21",
    },
    {
      id: "3",
      title: "Looking for bulk tomato suppliers",
      author: "Fresh Market Co.",
      category: "Marketplace",
      replies: 8,
      views: 167,
      likes: 12,
      status: "active",
      pinned: false,
      flagged: false,
      createdAt: "2024-02-15",
      lastActivity: "2024-02-20",
    },
    {
      id: "4",
      title: "Inappropriate content example",
      author: "Suspicious User",
      category: "General",
      replies: 2,
      views: 45,
      likes: 0,
      status: "pending",
      pinned: false,
      flagged: true,
      createdAt: "2024-02-22",
      lastActivity: "2024-02-22",
    },
  ]

  const stats = {
    totalPosts: 1847,
    activePosts: 1823,
    pendingReview: 12,
    flaggedPosts: 5,
  }

  const categories = [
    { name: "Farming Tips", posts: 456, color: "bg-green-100 text-green-800" },
    { name: "Worker Resources", posts: 234, color: "bg-blue-100 text-blue-800" },
    { name: "Marketplace", posts: 189, color: "bg-purple-100 text-purple-800" },
    { name: "General", posts: 167, color: "bg-gray-100 text-gray-800" },
    { name: "Equipment", posts: 123, color: "bg-orange-100 text-orange-800" },
  ]

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold">Community Content</h1>
          <p className="text-muted-foreground">Manage forum posts, discussions, and community content</p>
        </div>
        <Button>Create Announcement</Button>
      </header>

      {/* Stats Grid */}
      <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPosts.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">All community posts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Posts</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activePosts.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Currently visible</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingReview}</div>
            <p className="text-xs text-muted-foreground">Awaiting moderation</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Flagged Posts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.flaggedPosts}</div>
            <p className="text-xs text-muted-foreground">Need attention</p>
          </CardContent>
        </Card>
      </section>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Filters and Search */}
          <Card>
            <CardHeader>
              <CardTitle>Post Management</CardTitle>
              <CardDescription>Search, filter, and moderate community posts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4 md:flex-row md:items-center">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input placeholder="Search posts, authors, or content..." className="pl-10" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Filter className="mr-2 h-4 w-4" />
                    Filter
                  </Button>
                  <Button variant="outline" size="sm">
                    Export
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Posts Table */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b">
                    <tr className="text-left">
                      <th className="p-4 font-medium">Post</th>
                      <th className="p-4 font-medium">Author</th>
                      <th className="p-4 font-medium">Category</th>
                      <th className="p-4 font-medium">Engagement</th>
                      <th className="p-4 font-medium">Status</th>
                      <th className="p-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {posts.map((post) => (
                      <tr key={post.id} className="border-b hover:bg-muted/50">
                        <td className="p-4">
                          <div className="flex items-start gap-3">
                            <div className="flex flex-col gap-1">
                              {post.pinned && <Pin className="h-4 w-4 text-blue-500" />}
                              {post.flagged && <AlertTriangle className="h-4 w-4 text-red-500" />}
                            </div>
                            <div className="flex-1">
                              <div className="font-medium line-clamp-2">{post.title}</div>
                              <div className="text-sm text-muted-foreground">
                                Created {post.createdAt} • Last activity {post.lastActivity}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="font-medium">{post.author}</div>
                        </td>
                        <td className="p-4">
                          <Badge variant="outline">{post.category}</Badge>
                        </td>
                        <td className="p-4">
                          <div className="space-y-1">
                            <div className="text-sm">
                              <span className="text-muted-foreground">Replies:</span> {post.replies}
                            </div>
                            <div className="text-sm">
                              <span className="text-muted-foreground">Views:</span> {post.views}
                            </div>
                            <div className="text-sm">
                              <span className="text-muted-foreground">Likes:</span> {post.likes}
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex flex-col gap-1">
                            <Badge
                              variant={
                                post.status === "active"
                                  ? "secondary"
                                  : post.status === "pending"
                                    ? "outline"
                                    : "destructive"
                              }
                            >
                              {post.status}
                            </Badge>
                            {post.pinned && (
                              <Badge variant="outline" className="text-xs">
                                Pinned
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Eye className="mr-2 h-4 w-4" />
                                View Post
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Post
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Pin className="mr-2 h-4 w-4" />
                                {post.pinned ? "Unpin" : "Pin"} Post
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Lock className="mr-2 h-4 w-4" />
                                Lock Thread
                              </DropdownMenuItem>
                              {post.status === "pending" && (
                                <DropdownMenuItem>
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                  Approve
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem className="text-red-600">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Categories */}
          <Card>
            <CardHeader>
              <CardTitle>Categories</CardTitle>
              <CardDescription>Post distribution by category</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {categories.map((category) => (
                <div key={category.name} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{category.name}</span>
                  <Badge className={category.color}>{category.posts}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start bg-transparent">
                <Pin className="mr-2 h-4 w-4" />
                Manage Pinned Posts
              </Button>

              <Button variant="outline" className="w-full justify-start bg-transparent">
                <AlertTriangle className="mr-2 h-4 w-4" />
                Review Flagged Content
              </Button>

              <Button variant="outline" className="w-full justify-start bg-transparent">
                <Users className="mr-2 h-4 w-4" />
                Moderate Users
              </Button>

              <Button variant="outline" className="w-full justify-start bg-transparent">
                <MessageSquare className="mr-2 h-4 w-4" />
                Community Guidelines
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
