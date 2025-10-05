"use client";

import { useGlobalShortcuts } from "@/lib/hooks/use-global-shortcuts";

export default function GlobalShortcutsWrapper() {
  useGlobalShortcuts();

  return null;
}
