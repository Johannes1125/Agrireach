import type React from "react";
import { getCurrentUser } from "@/lib/auth-server";
import { redirect } from "next/navigation";

export default async function CourseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/auth/login");
  }

  return (
    <div className="min-h-screen bg-background">
      {/* If ProfileHeader needs user prop, add it here */}
      {/* <ProfileHeader user={user} /> */}
      {children}
    </div>
  );
}
