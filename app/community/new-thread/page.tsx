"use client";

import type React from "react";

import { useEffect, useState } from "react";
import { ArrowLeft, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { RouteGuard } from "@/components/auth/route-guard";
import { SlideTransition } from "@/components/ui/page-transition";
import {
  Dialog,
  DialogAction,
  DialogCancel,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { ImageUpload, UploadedImage } from "@/components/ui/image-upload";
import { useLoading } from "@/hooks/use-loading";
import { handleRoleValidationError } from "@/lib/role-validation-client";
import { authFetch } from "@/lib/auth-client";

interface Category {
  _id: string;
  name: string;
  icon?: string;
}
const defaultCategories: Category[] = [
  {
    _id: "Farming Tips & Techniques",
    name: "Farming Tips & Techniques",
    icon: "🌱",
  },
  { _id: "Market Discussions", name: "Market Discussions", icon: "📈" },
  { _id: "Equipment & Tools", name: "Equipment & Tools", icon: "🚜" },
  { _id: "Weather & Seasons", name: "Weather & Seasons", icon: "🌤️" },
  { _id: "Success Stories", name: "Success Stories", icon: "🏆" },
  { _id: "General Discussion", name: "General Discussion", icon: "💬" },
];

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
];

export default function NewThreadPage() {
  return (
    <RouteGuard requireAuth>
      <NewThreadPageContent />
    </RouteGuard>
  );
}

function NewThreadPageContent() {
  const { withLoading } = useLoading();
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    category: undefined as string | undefined,
    tags: [] as string[],
    images: [] as string[],
  });
  const [newTag, setNewTag] = useState("");
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [categoryOptions, setCategoryOptions] =
    useState<Category[]>(defaultCategories);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/community/categories");
        const json = await res.json().catch(() => ({}));
        const items: Category[] = (json?.data?.items || []).map((c: any) => ({
          _id: String(c._id || c.name),
          name: c.name,
          icon: c.icon,
        }));
        if (res.ok) {
          const merged = [...defaultCategories, ...items];
          const unique = Array.from(
            merged
              .reduce((map, c) => {
                const key = String(c._id || c.name).toLowerCase();
                if (!map.has(key)) map.set(key, c);
                return map;
              }, new Map<string, Category>())
              .values()
          );
          setCategoryOptions(unique);
        }
      } catch {
        // keep defaults
      }
    };
    load();
  }, []);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const addTag = (tag: string) => {
    if (
      tag.trim() &&
      !formData.tags.includes(tag.trim()) &&
      formData.tags.length < 5
    ) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, tag.trim()],
      }));
    }
  };

  const removeTag = (tag: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tag),
    }));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("Form submitted!");
    console.log("Form data:", formData);
    const form = e.currentTarget;
    console.log("Form validity:", form.checkValidity());
    setShowConfirmDialog(true);
  };

  const handleConfirmedSubmit = async () => {
    console.log("Confirmed submit clicked!");
    console.log("Cookies:", document.cookie);
    console.log(
      "Has agrireach_at cookie:",
      document.cookie.includes("agrireach_at")
    );

    // Test authentication first
    try {
      console.log("Testing authentication with /api/users/me");
      const authTest = await authFetch("/api/users/me");
      console.log("Auth test status:", authTest.status);
      console.log("Auth test ok:", authTest.ok);
      if (!authTest.ok) {
        const authError = await authTest.json().catch(() => ({}));
        console.error("Authentication failed:", authError);
        toast.error("Please log in again");
        return;
      }
      console.log(
        "Authentication successful, proceeding with thread creation..."
      );
    } catch (authError) {
      console.error("Auth test error:", authError);
      toast.error("Authentication error");
      return;
    }

    setShowConfirmDialog(false);
    setIsSubmitting(true);

    console.log("About to call withLoading...");
    try {
      const promise = (async () => {
        console.log("Inside withLoading callback...");
        const payload: any = {
          title: formData.title,
          content: formData.content,
          tags: formData.tags,
        };
        const selected =
          categoryOptions.find((c) => c._id === formData.category) || null;
        const isObjectId = formData.category
          ? /^[a-fA-F0-9]{24}$/.test(formData.category)
          : false;
        if (formData.category) {
          if (isObjectId) payload.category_id = formData.category;
          else if (selected?.name) payload.category = selected.name;
          else payload.category = formData.category;
        }

        console.log("Making API call to /api/community/threads");
        console.log("Payload:", payload);
        console.log("Request headers will include cookies automatically");
        const res = await authFetch("/api/community/threads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        console.log("API Response status:", res.status);
        console.log("API Response ok:", res.ok);
        const json = await res.json().catch(() => ({}));
        console.log("API Response JSON:", json);
        if (!res.ok) throw new Error(json?.message || "Failed to post thread");
        const newId = json?.data?.id;
        console.log("New thread ID:", newId);
        toast.success("Thread posted successfully!");
        // Add delay to show loading for at least 5 seconds
        await new Promise((resolve) => setTimeout(resolve, 3000));
        window.location.href = newId
          ? `/community/thread/${newId}`
          : "/community";
      })();

      await withLoading(promise, "Posting your discussion...");
    } catch (e: any) {
      console.error("Thread creation error:", e);
      console.error("Error message:", e?.message);
      console.error("Error stack:", e?.stack);
      console.error("Error type:", typeof e);
      console.error("Error constructor:", e?.constructor?.name);
      // Check if it's a role validation error
      if (e?.message?.includes("role") && e?.message?.includes("Settings")) {
        handleRoleValidationError(e);
      } else {
        toast.error(e?.message || "Failed to post thread");
      }
    } finally {
      console.log("Setting isSubmitting to false");
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <SlideTransition>
        <div className="min-h-screen bg-background">
          {/* Header */}
          <div className="sticky top-0 z-40 border-b bg-white/80 dark:bg-zinc-900/80 border-zinc-200 dark:border-zinc-800 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-zinc-900/60">
            {" "}
            <div className="container mx-auto px-4 py-4">
              <Link
                href="/community"
                className="inline-flex items-center text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Community
              </Link>
            </div>
          </div>

          <div className="container mx-auto px-4 py-6 max-w-4xl">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-foreground font-sans mb-2">
                Start a New Discussion
              </h1>
              <p className="text-muted-foreground">
                Share your knowledge, ask questions, or start a conversation
              </p>
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
                    <Select
                      value={formData.category || ""}
                      onValueChange={(value) =>
                        handleInputChange("category", value)
                      }
                    >
                      <SelectTrigger className="bg-white text-zinc-900 border border-zinc-200 focus:ring-0 dark:bg-white/5 dark:text-white dark:border-white">
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categoryOptions
                          .filter((c) => c && (c._id || c.name))
                          .map((category, idx) => {
                            const id = String(
                              category._id || category.name || idx
                            );
                            return (
                              <SelectItem key={id} value={id}>
                                <div className="flex items-center gap-2">
                                  <span>{category.icon || "💬"}</span>
                                  <span>{category.name || id}</span>
                                </div>
                              </SelectItem>
                            );
                          })}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="title">Thread Title *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) =>
                        handleInputChange("title", e.target.value)
                      }
                      placeholder="Write a clear, descriptive title..."
                      required
                    />
                    <p className="text-sm text-muted-foreground">
                      A good title helps others understand what your discussion
                      is about
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="content">Content *</Label>
                    <Textarea
                      id="content"
                      value={formData.content}
                      onChange={(e) =>
                        handleInputChange("content", e.target.value)
                      }
                      placeholder="Share your thoughts, experiences, questions, or tips..."
                      rows={8}
                      required
                    />
                    <p className="text-sm text-muted-foreground">
                      Provide details, context, and be specific to get the best
                      responses
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
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addTag(newTag);
                            setNewTag("");
                          }
                        }}
                      />
                      <Button
                        type="button"
                        onClick={() => {
                          addTag(newTag);
                          setNewTag("");
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
                          <Badge
                            key={index}
                            variant="secondary"
                            className="flex items-center gap-1"
                          >
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
                          disabled={
                            formData.tags.includes(tag) ||
                            formData.tags.length >= 5
                          }
                          className="text-xs"
                        >
                          {tag}
                        </Button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Images */}
              <Card>
                <CardHeader>
                  <CardTitle>Images (Optional)</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Add up to 3 images to support your discussion
                  </p>
                </CardHeader>
                <CardContent>
                  <ImageUpload
                    type="community"
                    maxFiles={3}
                    maxSizeMB={10}
                    acceptedTypes={[
                      "image/jpeg",
                      "image/jpg",
                      "image/png",
                      "image/webp",
                    ]}
                    onUploadComplete={(images) => {
                      const imageUrls = images.map((img) => img.url);
                      setFormData({ ...formData, images: imageUrls });
                      toast.success(
                        `${images.length} image(s) uploaded successfully`
                      );
                    }}
                    onUploadError={(error) => {
                      toast.error(`Upload failed: ${error}`);
                    }}
                  />
                </CardContent>
              </Card>

              {/* Guidelines */}
              <Card>
                <CardHeader>
                  <CardTitle>Community Guidelines</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>
                      • Be respectful and constructive in your discussions
                    </li>
                    <li>
                      • Stay on topic and provide helpful, accurate information
                    </li>
                    <li>
                      • Use clear, descriptive titles and proper formatting
                    </li>
                    <li>
                      • Search existing threads before posting duplicate
                      questions
                    </li>
                    <li>• Share your experiences and learn from others</li>
                  </ul>
                </CardContent>
              </Card>

              {/* Submit */}
              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting}
                onClick={() => console.log("Submit button clicked!")}
              >
                {isSubmitting ? "Posting..." : "Post Discussion"}
              </Button>
            </form>
          </div>
        </div>
      </SlideTransition>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Discussion Post</DialogTitle>
            <DialogDescription>
              Are you sure you want to post this discussion? Once published, it
              will be visible to all community members and they can start
              responding.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogCancel>Cancel</DialogCancel>
            <DialogAction
              onClick={() => {
                console.log("DialogAction clicked!");
                handleConfirmedSubmit();
              }}
            >
              Post Discussion
            </DialogAction>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
