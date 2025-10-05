"use client";

import React from "react";
import { AppLayout } from "./app-layout";
import { PageAnnouncer } from "@/components/accessibility/page-announcer";

interface AccessibleAppLayoutProps {
  children: React.ReactNode;
}

/**
 * Enhanced AppLayout with accessibility features
 * This ensures consistent accessibility features across all pages
 */
export function AccessibleAppLayout({ children }: AccessibleAppLayoutProps) {
  return (
    <PageAnnouncer>
      <AppLayout>{children}</AppLayout>
    </PageAnnouncer>
  );
}

export default AccessibleAppLayout;
