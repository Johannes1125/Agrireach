import React from "react";
import { Metadata } from "next";
import AccessibilityPageClient from "./accessibility-page-client";

export const metadata: Metadata = {
  title: "Accessibility - AgriReach",
  description: "Accessibility features and settings for the AgriReach platform",
};

export default function AccessibilityPage() {
  return <AccessibilityPageClient />;
}
