"use client";

import { ReactNode } from "react";

// A simple component that only renders on the client side
export function ClientOnly({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
