import type React from "react";
import { AccessibleAppLayout } from "@/components/layout/accessible-app-layout";

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AccessibleAppLayout>{children}</AccessibleAppLayout>;
}
