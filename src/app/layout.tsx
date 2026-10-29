import type { Metadata } from "next"
import { Plus_Jakarta_Sans, Inter } from "next/font/google"
import "./globals.css"
import "@/lib/env"
import { ThemeProvider } from "@/components/shared/theme-provider"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Toaster } from "sonner"

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-heading",
  subsets: ["latin"],
  display: "swap",
  weight: ["500", "600", "700", "800"],
})

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
})

export const metadata: Metadata = {
  title: {
    default: "Pairly — Share Skills. Help Others. Grow Together.",
    template: "%s | Pairly",
  },
  description:
    "A university-level peer-to-peer skill exchange platform connecting students, educators, professionals, and community members through reciprocal smart matching.",
  keywords: [
    "skill exchange",
    "peer to peer",
    "smart matching",
    "student mentoring",
    "teacher collaboration",
    "professional development",
    "Pairly",
  ],
  authors: [{ name: "Pairly University Project" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://pairly.vercel.app",
    title: "Pairly — Share Skills. Help Others. Grow Together.",
    description: "University peer-to-peer skill exchange platform with reciprocal smart matching.",
    siteName: "Pairly",
  },
  twitter: {
    card: "summary_large_image",
    title: "Pairly — Peer-to-Peer Skill Exchange",
    description: "Share Skills. Help Others. Grow Together.",
  },
  icons: {
    icon: "/favicon.ico",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${plusJakartaSans.variable} ${inter.variable}`}>
      <body className="min-h-screen bg-background font-sans text-foreground antialiased selection:bg-primary/20 selection:text-primary">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange={false}
        >
          <TooltipProvider>
            {children}
            <Toaster position="top-right" richColors />
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
