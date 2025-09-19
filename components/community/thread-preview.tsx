import { MessageSquare, Eye, ThumbsUp } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Link from "next/link"

interface Thread {
  id: number
  title: string
  author: {
    name: string
    avatar: string
    role: string
  }
  createdAt: string
  replies: number
  views: number
  likes: number
  tags: string[]
  lastReply?: {
    author: string
    time: string
  }
}

interface ThreadPreviewProps {
  thread: Thread
  showCategory?: boolean
  category?: string
}

export function ThreadPreview({ thread, showCategory = false, category }: ThreadPreviewProps) {
  return (
    <article className="hover:shadow-md transition-shadow">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={thread.author.avatar || "/placeholder.svg"} />
              <AvatarFallback>{thread.author.name[0]}</AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <Link href={`/community/thread/${thread.id}`}>
                <h3 className="font-semibold hover:text-primary cursor-pointer line-clamp-2 mb-1">{thread.title}</h3>
              </Link>

              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <span>
                  by <span className="font-medium">{thread.author.name}</span>
                </span>
                <Badge variant="outline" className="text-xs">
                  {thread.author.role}
                </Badge>
                {showCategory && category && (
                  <>
                    <span>•</span>
                    <Badge variant="secondary" className="text-xs">
                      {category}
                    </Badge>
                  </>
                )}
                <span>•</span>
                <span>{thread.createdAt}</span>
              </div>

              <div className="flex flex-wrap gap-1 mb-2">
                {thread.tags.slice(0, 3).map((tag, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
                {thread.tags.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{thread.tags.length - 3}
                  </Badge>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <MessageSquare className="h-3 w-3" />
                    <span>{thread.replies}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    <span>{thread.views}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <ThumbsUp className="h-3 w-3" />
                    <span>{thread.likes}</span>
                  </div>
                </div>

                {thread.lastReply && (
                  <div className="text-xs text-muted-foreground">
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
    </article>
  )
}
