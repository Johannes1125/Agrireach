"use client"

import type React from "react"

import { useState } from "react"
import { ArrowLeft, Plus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

const categories = [
  { id: 1, name: "Farming Tips & Techniques", icon: "🌱" },
  { id: 2, name: "Market Discussions", icon: "📈" },
  { id: 3, name: "Equipment & Tools", icon: "🚜" },
  { id: 4, name: "Weather & Seasons", icon: "🌤️" },
  { id: 5, name: "Success Stories", icon: "🏆" },
  { id: 6, name: "General Discussion", icon: "💬" },
]

const suggestedTags = [
  "organic",
  "pest-control",
  "irrigation",
  "soil-health",
  "crop-rotation",
  "fertilizer",
  "harvest",
  "planting",
  "weather",
  "equipment",
  "market-prices",
  "sustainable",
  "beginner-tips",
  "advanced-techniques",
]

export default function NewThreadPage() {
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    category: "",
    tags: [] as string[],
  })
  const [newTag, setNewTag] = useState("")

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const addTag = (tag: string) => {
    if (tag.trim() && !formData.tags.includes(tag.trim()) && formData.tags.length < 5) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, tag.trim()],
      }))
    }
  }

  const removeTag = (tag: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tag),
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle form submission
    console.log("New thread:", formData)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <Link href="/community" className="inline-flex items-center text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Community
          </Link>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground font-sans mb-2">Start a New Discussion</h1>
          <p className="text-muted-foreground">Share your knowledge, ask questions, or start a conversation</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Thread Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        <div className="flex items-center gap-2">
                          <span>{category.icon}</span>
                          <span>{category.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Thread Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  placeholder="Write a clear, descriptive title..."
                  required
                />
                <p className="text-sm text-muted-foreground">
                  A good title helps others understand what your discussion is about
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Content *</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => handleInputChange("content", e.target.value)}
                  placeholder="Share your thoughts, experiences, questions, or tips..."
                  rows={8}
                  required
                />
                <p className="text-sm text-muted-foreground">
                  Provide details, context, and be specific to get the best responses
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Tags */}
          <Card>
            <CardHeader>
              <CardTitle>Tags</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Add Tags (up to 5)</Label>
                <div className="flex gap-2">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Add a tag..."
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        addTag(newTag)
                        setNewTag("")
                      }
                    }}
                  />
                  <Button
                    type="button"
                    onClick={() => {
                      addTag(newTag)
                      setNewTag("")
                    }}
                    variant="outline"
                    disabled={formData.tags.length >= 5}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="flex items-center gap-1">
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="ml-1 hover:text-destructive"
                          title={`Remove tag ${tag}`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Suggested Tags</Label>
                <div className="flex flex-wrap gap-2">
                  {suggestedTags.map((tag, index) => (
                    <Button
                      key={index}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addTag(tag)}
                      disabled={formData.tags.includes(tag) || formData.tags.length >= 5}
                      className="text-xs"
                    >
                      {tag}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Guidelines */}
          <Card>
            <CardHeader>
              <CardTitle>Community Guidelines</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Be respectful and constructive in your discussions</li>
                <li>• Stay on topic and provide helpful, accurate information</li>
                <li>• Use clear, descriptive titles and proper formatting</li>
                <li>• Search existing threads before posting duplicate questions</li>
                <li>• Share your experiences and learn from others</li>
              </ul>
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex gap-4">
            <Button type="submit" className="flex-1">
              Post Discussion
            </Button>
            <Button type="button" variant="outline">
              Save as Draft
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
