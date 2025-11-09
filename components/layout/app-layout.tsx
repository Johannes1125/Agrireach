import type React from "react";
import { AppSidebar } from "./app-sidebar";
import { ChatWidget } from "@/components/chat/chat-widget";
import { BottomNavigation } from "./bottom-navigation";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="flex min-h-screen bg-background w-full">
      <AppSidebar />
      <main id="main-content" className="flex-1 lg:ml-4 min-h-screen w-full">
        {children}
      </main>
      <ChatWidget />
      <BottomNavigation />
    </div>
  );
}
