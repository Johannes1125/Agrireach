import type { Metadata } from "next";
import { Open_Sans } from "next/font/google";
import { Montserrat } from "next/font/google";
import { GeistMono } from "geist/font/mono";
import { Analytics } from "@vercel/analytics/next";
import { ThemeProvider } from "@/components/theme-provider";
import { Suspense } from "react";
import { AccessibilityProvider } from "@/components/accessibility/accessibility-provider";
import { AccessibilitySettings } from "@/components/accessibility/accessibility-settings";
import SkipToContent from "@/components/accessibility/skip-to-content";
import "./globals.css";

// We'll handle global shortcuts using the 'use client' directive in the appropriate components
// Rather than trying to import them here where TypeScript might not see them yet

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
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta
          name="theme-color"
          content="#ffffff"
          media="(prefers-color-scheme: light)"
        />
        <meta
          name="theme-color"
          content="#171717"
          media="(prefers-color-scheme: dark)"
        />
      </head>
      <body
        className={`font-sans ${openSans.variable} ${montserrat.variable} ${
          GeistMono?.variable ?? ""
        }`}
      >
        <Suspense fallback={null}>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
          >
            <AccessibilityProvider>
              {/* Skip to content link for keyboard users */}
              <SkipToContent />

              {/* The accessibility settings will be included in each layout as needed */}
              {/* This ensures the accessibility button is visible on all pages */}

              {children}
            </AccessibilityProvider>
          </ThemeProvider>
        </Suspense>
        <Analytics />
      </body>
    </html>
  );
}
