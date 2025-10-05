import type React from "react";
import { AccessibleAppLayout } from "@/components/layout/accessible-app-layout";

export default function ReviewsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AccessibleAppLayout>{children}</AccessibleAppLayout>;
}
