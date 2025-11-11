"use client";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { getRoleDisplay } from "@/lib/role-utils";
import { Card, CardContent } from "@/components/ui/card";
import {
  MapPin,
  Calendar,
  Star,
  Shield,
  Edit,
  Share,
  MessageSquare,
  ArrowLeft,
  Settings,
  Building,
  Clock,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import ShareProfileCard from "./ShareProfileCard";
import { useRef, useState } from "react";
import * as htmlToImage from "html-to-image";
import Link from "next/link";
import { useUserProfile } from "@/hooks/use-user-profile";
// skills utils not needed here anymore

interface User {
  id: string;
  name: string;
  email: string;
  role: "worker" | "recruiter" | "buyer";
  avatar: string;
  location: string;
  joinDate: string;
  bio?: string;
  verified?: boolean;
  rating?: number;
  completedJobs?: number;
}

interface ProfileHeaderProps {
  user: User;
}

export function ProfileHeader({ user }: ProfileHeaderProps) {
  const { profile } = useUserProfile();
  const hasBusiness = !!(
    profile &&
    (profile.company_name ||
      profile.business_type ||
      profile.industry ||
      profile.company_size ||
      profile.website ||
      profile.business_description ||
      (Array.isArray(profile.services_offered) &&
        profile.services_offered.length > 0) ||
      typeof profile.years_in_business === "number")
  );
  // No skill fetching here to keep header lightweight

  const getRoleBadge = (role: string) => {
    const label = getRoleDisplay(role);
    if (!label) return null;
    if (role === "buyer")
      return (
        <Badge className="bg-accent text-accent-foreground text-sm">
          {label}
        </Badge>
      );
    if (role === "recruiter")
      return (
        <Badge variant="outline" className="text-sm">
          {label}
        </Badge>
      );
    return (
      <Badge variant="secondary" className="text-sm">
        {label}
      </Badge>
    );
  };

  const formatJoinDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
    });
  };

  const [shareOpen, setShareOpen] = useState(false);
  const cardRef = useRef<HTMLDivElement | null>(null);

  const handleDownload = async () => {
    try {
      // Find the card node inside the dialog by id
      const node = document.getElementById("share-profile-card");
      if (!node) return;

      const dataUrl = await (htmlToImage as any).toPng(node, {
        cacheBust: true,
      });
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `${(user.name || "profile").replace(
        /\s+/g,
        "_"
      )}_agrireach.png`;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Failed to export image", err);
    }
  };

  return (
    <div className="bg-card border-b">
      <div className="container px-4 py-8">
        {/* Back Navigation */}
        <div className="mb-6">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </div>

        <Card>
          <CardContent className="p-8">
            <div className="flex flex-col gap-6 md:flex-row md:items-start">
              {/* Avatar and Basic Info */}
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-6">
                <Avatar className="h-32 w-32 ring-2 ring-black">
                  <AvatarImage
                    src={
                      hasBusiness && profile?.business_logo
                        ? profile.business_logo
                        : user.avatar || "/placeholder.svg"
                    }
                    alt={
                      hasBusiness && profile?.company_name
                        ? profile.company_name
                        : user.name
                    }
                  />
                  <AvatarFallback className="text-2xl">
                    {hasBusiness && profile?.company_name
                      ? profile.company_name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                      : user.name
                      ? user.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                      : "U"}
                  </AvatarFallback>
                </Avatar>

                <div className="flex flex-col gap-3 text-center md:text-left">
                  <div className="flex flex-col items-center gap-2 md:flex-row md:items-center md:gap-3">
                    <h1 className="font-heading text-3xl font-bold">
                      {hasBusiness && profile?.company_name
                        ? profile.company_name
                        : user.name || "User"}
                    </h1>
                    {user.verified && (
                      <>
                        <Shield className="h-6 w-6 text-primary" />
                        <span className="sr-only">Verified Profile</span>
                      </>
                    )}
                  </div>

                  {hasBusiness && profile?.company_name && (
                    <div className="flex items-center justify-center gap-2 text-muted-foreground md:justify-start">
                      <Building className="h-4 w-4" />
                      <span className="text-sm">Owned by {user.name}</span>
                    </div>
                  )}

                  {hasBusiness && profile?.business_address && (
                    <div className="flex items-center justify-center gap-2 text-muted-foreground md:justify-start">
                      <MapPin className="h-4 w-4" />
                      <span className="text-sm">
                        {profile.business_address}
                      </span>
                    </div>
                  )}

                  <div className="flex flex-col items-center gap-3 md:flex-row md:items-center md:gap-4 md:justify-start">
                    {getRoleBadge(user.role)}

                    {user.rating && (
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-medium">{user.rating}</span>
                        {user.completedJobs && (
                          <span className="text-muted-foreground">
                            ({user.completedJobs} jobs)
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Profile Details */}
              <div className="flex-1 space-y-4">
                {user.bio && (
                  <p className="text-muted-foreground leading-relaxed max-w-2xl">
                    {user.bio}
                  </p>
                )}

                <div className="flex flex-col gap-3 sm:gap-4">
                  <div className="flex items-start gap-3 text-muted-foreground">
                    <MapPin className="mt-1 h-4 w-4" />
                    <span className="text-sm leading-relaxed whitespace-pre-line">
                      {user.location}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span className="text-sm">
                      Joined {formatJoinDate(user.joinDate)}
                    </span>
                  </div>
                  {hasBusiness && profile?.business_hours && (
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span className="text-sm">
                        Business Hours: {profile.business_hours}
                      </span>
                    </div>
                  )}
                </div>

                {/* Skills removed by request */}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3 pt-6 md:flex-row md:items-center">
              <Button size="lg" className="w-full md:w-auto" asChild>
                <Link href="/settings">
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Profile
                </Link>
              </Button>

              <Button
                variant="outline"
                size="lg"
                className="w-full md:w-auto bg-transparent"
                asChild
              >
                <Link href="/settings">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Link>
              </Button>

              <>
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full md:w-auto bg-transparent"
                  onClick={() => setShareOpen(true)}
                >
                  <Share className="mr-2 h-4 w-4" />
                  Share Profile
                </Button>

                <Dialog open={shareOpen} onOpenChange={setShareOpen}>
                  <DialogContent className="max-w-3xl">
                    <DialogHeader>
                      <DialogTitle>Share Profile</DialogTitle>
                    </DialogHeader>

                    <div className="mt-4 space-y-4">
                      <div className="flex justify-center">
                        {/* Card preview wrapper ensures card scales to fit */}
                        <div className="w-full max-w-[680px] overflow-hidden">
                          <ShareProfileCard
                            name={
                              hasBusiness && profile?.company_name
                                ? profile.company_name
                                : user.name || "User"
                            }
                            avatar={
                              hasBusiness && profile?.business_logo
                                ? profile.business_logo
                                : user.avatar || "/placeholder.svg"
                            }
                            role={getRoleDisplay(user.role) || undefined}
                            location={user.location}
                            joinDate={formatJoinDate(user.joinDate)}
                            memberLevel={user.role}
                          />
                        </div>
                      </div>

                      <div className="flex justify-end gap-3">
                        <Button
                          variant="outline"
                          onClick={() => setShareOpen(false)}
                        >
                          Close
                        </Button>
                        <Button onClick={handleDownload}>Download Image</Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
