import type { Metadata } from "next";
import React from "react";
import { SimpleHeader } from "@/components/layout/simple-header";
import { PageTransition } from "@/components/ui/page-transition";
import { getCurrentUser } from "@/lib/auth-server";
import { redirect } from "next/navigation";
import { AppLayout } from "@/components/layout/app-layout";

export const metadata: Metadata = {
  title: "Producers",
  description:
    "Discover local farmers and artisans for partnerships and collaborations.",
};

export default async function ProducersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  const headerUser = user
    ? {
        id: user.id,
        name: user.full_name || "",
        email: user.email,
        role: (Array.isArray(user.roles)
          ? user.roles[0]
          : (user.role as any)) as "worker" | "recruiter" | "buyer" | "admin",
        avatar: user.avatar_url || "",
        location: user.location || "",
      }
    : undefined;

  return (
    <AppLayout>
      <SimpleHeader user={headerUser} />
      <PageTransition>
        <section className="container mx-auto px-4 py-6">{children}</section>
      </PageTransition>
    </AppLayout>
  );
}
