import type React from "react";
import { AccessibleAppLayout } from "@/components/layout/accessible-app-layout";

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AccessibleAppLayout>{children}</AccessibleAppLayout>;
}
