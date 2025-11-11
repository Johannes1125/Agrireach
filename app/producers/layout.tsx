import type { Metadata } from "next";
import React from "react";
import { PageTransition } from "@/components/ui/page-transition";
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
  return (
    <AppLayout>
      <PageTransition>
        <section className="container mx-auto px-4 py-6">{children}</section>
      </PageTransition>
    </AppLayout>
  );
}
