import { redirect } from "next/navigation"
import { ProfileHeader } from "@/components/profile/profile-header"
import { UnifiedProfile } from "@/components/profile/unified-profile"
import { getCurrentUser } from "@/lib/auth-server"

export const dynamic = "force-dynamic"

export default async function ProfilePage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/auth/login")
  }

  const primaryRole =
    (Array.isArray((user as any).roles) && (user as any).roles[0]) || user.role;
  const displayRole =
    primaryRole === "admin" ? "buyer" : (primaryRole as "worker" | "recruiter" | "buyer");
  const joinDate = user.created_at
    ? new Date(user.created_at).toISOString().split("T")[0]
    : "";

  return (
    <div className="min-h-screen bg-background">
      <ProfileHeader user={{
        id: user.id,
        name: user.full_name,
        email: user.email,
        role: displayRole,
        avatar: user.avatar_url || "",
        location: user.location || "Not specified",
        joinDate,
        bio: "Experienced member of the AgriReach community.",
        verified: user.verified,
        rating: (user.trust_score ?? 0) / 20, // Convert trust score (0-100) to rating (0-5)
        completedJobs: 0, // This would need to be fetched from applications/orders
      }} />

      <main className="container px-4 py-8">
        <UnifiedProfile
          user={{
            id: user.id,
            name: user.full_name,
            email: user.email,
            role: displayRole,
            location: user.location || "Not specified",
            joinDate,
            bio: "Experienced member of the AgriReach community.",
            verified: user.verified,
            rating: (user.trust_score ?? 0) / 20,
            completedJobs: 0,
          }}
        />
      </main>
    </div>
  )
}
