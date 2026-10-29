"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import { Moon, Sun, Laptop } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function ThemeToggle() {
  const { setTheme, theme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="relative rounded-full text-foreground hover:bg-accent focus-visible:ring-primary" aria-label="Toggle theme" />}>
        <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-foreground" />
        <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-foreground" />
        <span className="sr-only">Toggle theme</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-36 rounded-xl border border-border bg-card p-1 shadow-lg">
        <DropdownMenuItem
          onClick={() => setTheme("light")}
          className="flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium hover:bg-accent"
        >
          <Sun className="h-3.5 w-3.5 text-amber-500" />
          <span>Light</span>
          {mounted && theme === "light" && <span className="ml-auto text-primary font-bold">✓</span>}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("dark")}
          className="flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium hover:bg-accent"
        >
          <Moon className="h-3.5 w-3.5 text-secondary" />
          <span>Dark</span>
          {mounted && theme === "dark" && <span className="ml-auto text-primary font-bold">✓</span>}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("system")}
          className="flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium hover:bg-accent"
        >
          <Laptop className="h-3.5 w-3.5 text-muted-foreground" />
          <span>System</span>
          {mounted && theme === "system" && <span className="ml-auto text-primary font-bold">✓</span>}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
