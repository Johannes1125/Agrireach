import type React from "react";
import { AppSidebar } from "./app-sidebar";
import GlobalAnnouncer from "@/components/accessibility/global-announcer";
import { AccessibilitySettings } from "@/components/accessibility/accessibility-settings";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="flex min-h-screen bg-background w-full relative">
      <AppSidebar />
      <main
        className="flex-1 lg:ml-4 min-h-screen w-full"
        id="main-content"
        tabIndex={-1}
      >
        {/* Main content */}
        {children}

        {/* Ensure accessibility features are visible in this layout */}
        <AccessibilitySettings position="bottom-left" />
        <GlobalAnnouncer />
      </main>
    </div>
  );
}
