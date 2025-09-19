import { redirect } from "next/navigation"
import { ProfileHeader } from "@/components/profile/profile-header"
import { UnifiedProfile } from "@/components/profile/unified-profile"

// TODO: Replace with actual auth check
const getCurrentUser = async () => {
  // Mock user data - replace with actual authentication
  return {
    id: "1",
    name: "John Farmer",
    email: "john@example.com",
    role: "worker" as const,
    avatar: "/farmer-avatar.png",
    location: "Rural Valley, CA",
    joinDate: "2024-01-15",
    bio: "Experienced organic farmer with 15 years in sustainable agriculture. Specializing in crop rotation and soil health management.",
    verified: true,
    rating: 4.8,
    completedJobs: 47,
  }
}

export default async function ProfilePage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/auth/login")
  }

  return (
    <div className="min-h-screen bg-background">
      <ProfileHeader user={user} />

      <main className="container px-4 py-8">
        <UnifiedProfile user={user} />
      </main>
    </div>
  )
}
