import type React from "react";
import type { Metadata } from "next";
import { Open_Sans } from "next/font/google";
import { Montserrat } from "next/font/google";
import { GeistMono } from "geist/font/mono";
import { Analytics } from "@vercel/analytics/next";
import { ThemeProvider } from "@/components/theme-provider";
import { Suspense } from "react";
import { Toaster } from "sonner";
import { NotificationProvider } from "@/components/notifications/notification-provider";
import { AccessibilityProvider } from "@/components/accessibility/accessibility-provider";
import { AccessibilitySettings } from "@/components/accessibility/accessibility-settings";
import { SkipToContent } from "@/components/accessibility/skip-to-content";
import { GlobalAnnouncer } from "@/components/accessibility/global-announcer";
import { PageAnnouncer } from "@/components/accessibility/page-announcer";
import { LoadingProvider } from "@/contexts/loading-context";
import "./globals.css";

const openSans = Open_Sans({
  subsets: ["latin"],
  variable: "--font-open-sans",
  display: "swap",
});

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  weight: ["400", "600", "700", "900"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "AgriReach - Connecting Rural Workers with Opportunities",
  description:
    "Empowering rural communities through sustainable agricultural connections and opportunities",
  generator: "AgriReach Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`font-sans ${openSans.variable} ${montserrat.variable} ${GeistMono.variable}`}
        suppressHydrationWarning
      >
        <SkipToContent />
        <Suspense fallback={null}>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
          >
            <AccessibilityProvider>
              <LoadingProvider>
                <GlobalAnnouncer />
                <PageAnnouncer>
                  <NotificationProvider>{children}</NotificationProvider>
                </PageAnnouncer>
                <AccessibilitySettings position="bottom-left" />
                <Toaster position="top-right" richColors />
              </LoadingProvider>
            </AccessibilityProvider>
          </ThemeProvider>
        </Suspense>
        <Analytics />
      </body>
    </html>
  );
}
