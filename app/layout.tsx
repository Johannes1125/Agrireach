import type React from "react"
import type { Metadata } from "next"
import { Open_Sans } from "next/font/google"
import { Montserrat } from "next/font/google"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { ThemeProvider } from "@/components/theme-provider"
import { Suspense } from "react"
import { Toaster } from "sonner"
import { NotificationProvider } from "@/components/notifications/notification-provider"
import "./globals.css"

const openSans = Open_Sans({
  subsets: ["latin"],
  variable: "--font-open-sans",
  display: "swap",
})

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  weight: ["400", "600", "700", "900"],
  display: "swap",
})

export const metadata: Metadata = {
  title: "AgriReach - Connecting Rural Workers with Opportunities",
  description: "Empowering rural communities through sustainable agricultural connections and opportunities",
  generator: "AgriReach Platform",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`font-sans ${openSans.variable} ${montserrat.variable} ${GeistMono.variable}`}>
        <Suspense fallback={null}>
          <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
            <NotificationProvider>{children}</NotificationProvider>
            <Toaster position="top-right" richColors />
          </ThemeProvider>
        </Suspense>
        <Analytics />
      </body>
    </html>
  )
}
