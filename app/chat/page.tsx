import { redirect } from "next/navigation"
import { SimpleHeader } from "@/components/layout/simple-header"
import { ChatInterface } from '@/components/chat/chat-interface'
import { getCurrentUser } from "@/lib/auth-server"

export default async function ChatPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/auth/login")
  }

  return (
    <div className="flex flex-col min-h-screen">
      <SimpleHeader user={{
        id: user.id,
        name: user.full_name,
        email: user.email,
        role: Array.isArray(user.role) ? user.role[0] : user.role,
        avatar: user.avatar_url || "",
        location: user.location || "Not specified",
      }} />

      <div className="flex-1 flex flex-col px-2 sm:px-4 py-4 sm:py-6">
        <div className="mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl font-semibold">Messages</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">Connect and chat with other users</p>
        </div>
        
        <div className="flex-1 min-h-0">
          <ChatInterface />
        </div>
      </div>
    </div>
  )
}
