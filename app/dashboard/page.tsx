import { redirect } from "next/navigation"
import { SimpleHeader } from "@/components/layout/simple-header"
import { UnifiedDashboard } from "@/components/dashboard/unified-dashboard"
import { getCurrentUser } from "@/lib/auth-server"

export default async function DashboardPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/auth/login")
  }

  return (
    <div className="min-h-screen bg-background">
      <SimpleHeader user={{
        id: user.id,
        name: user.full_name,
        email: user.email,
        role: user.role,
        avatar: user.avatar_url || "",
        location: user.location || "Not specified",
      }} />

      <main className="container px-4 py-8">
        <UnifiedDashboard user={{
          id: user.id,
          name: user.full_name,
          role: user.role,
          location: user.location || "Not specified",
          joinDate: new Date(user.created_at).toISOString().split('T')[0],
        }} />
      </main>
    </div>
  )
}
