"use client"

import { useState } from "react"
import { CheckCircle, X, Eye, Flag } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface ModerationItem {
  id: number
  type: "review" | "forum_post" | "listing" | "user_report"
  title: string
  content: string
  author: {
    name: string
    avatar: string
  }
  createdAt: string
  priority: "high" | "medium" | "low"
  flaggedReason: string
}

interface ModerationQueueProps {
  items: ModerationItem[]
  onApprove: (id: number) => void
  onReject: (id: number) => void
  onView: (id: number) => void
}

export function ModerationQueue({ items, onApprove, onReject, onView }: ModerationQueueProps) {
  const [selectedItems, setSelectedItems] = useState<number[]>([])

  const priorityColors: Record<ModerationItem["priority"], "default" | "secondary" | "destructive"> = {
    high: "destructive",
    medium: "default",
    low: "secondary",
  }

  const typeLabels = {
    review: "Review",
    forum_post: "Forum Post",
    listing: "Listing",
    user_report: "User Report",
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Flag className="h-5 w-5" />
          Moderation Queue ({items.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
            <p>All caught up! No items pending moderation.</p>
          </div>
        ) : (
          items.map((item) => (
            <div key={item.id} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={item.author.avatar || "/placeholder.svg"} />
                    <AvatarFallback>{item.author.name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium line-clamp-1">{item.title}</h4>
                      <Badge variant={priorityColors[item.priority]}>{item.priority}</Badge>
                      <Badge variant="outline">{typeLabels[item.type]}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">by {item.author.name}</p>
                    <p className="text-sm text-muted-foreground line-clamp-2">{item.content}</p>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">{item.createdAt}</span>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded p-2">
                <p className="text-sm text-yellow-800">
                  <strong>Flagged for:</strong> {item.flaggedReason}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button size="sm" onClick={() => onView(item.id)} variant="outline">
                  <Eye className="h-4 w-4 mr-2" />
                  View
                </Button>
                <Button size="sm" onClick={() => onApprove(item.id)} className="bg-green-600 hover:bg-green-700">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve
                </Button>
                <Button size="sm" onClick={() => onReject(item.id)} variant="destructive">
                  <X className="h-4 w-4 mr-2" />
                  Reject
                </Button>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
