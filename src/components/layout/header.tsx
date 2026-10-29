"use client"

import * as React from "react"
import Link from "next/link"
import { Menu, X } from "lucide-react"
import { Logo } from "@/components/shared/logo"
import { ThemeToggle } from "@/components/shared/theme-toggle"
import { Button } from "@/components/ui/button"
import { NAV_LINKS } from "@/lib/constants"

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/85 backdrop-blur-md transition-colors">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <Logo />

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8" aria-label="Main navigation">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-md px-1 py-0.5"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Desktop Actions & Theme Toggle */}
        <div className="hidden md:flex items-center gap-3">
          <ThemeToggle />
          <Link href="/login">
            <Button variant="ghost" className="font-medium text-foreground hover:bg-accent focus-visible:ring-primary">
              Log in
            </Button>
          </Link>
          <Link href="/signup">
            <Button className="bg-[#4B3F72] text-white hover:bg-[#3d335d] dark:bg-[#A78BFA] dark:text-[#0F0B1A] dark:hover:bg-[#906ef8] font-semibold shadow-sm focus-visible:ring-primary transition-all">
              Get started
            </Button>
          </Link>
        </div>

        {/* Mobile menu button */}
        <div className="flex md:hidden items-center gap-2">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle mobile menu"
            className="rounded-lg text-foreground"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-border bg-card px-4 pt-3 pb-6 shadow-xl animate-in slide-in-from-top-2">
          <nav className="flex flex-col gap-3" aria-label="Mobile navigation">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-3 flex flex-col gap-2 pt-3 border-t border-border">
              <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="outline" className="w-full justify-center">
                  Log in
                </Button>
              </Link>
              <Link href="/signup" onClick={() => setMobileMenuOpen(false)}>
                <Button className="w-full justify-center bg-[#4B3F72] text-white hover:bg-[#3d335d] dark:bg-[#A78BFA] dark:text-[#0F0B1A]">
                  Get started
                </Button>
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
