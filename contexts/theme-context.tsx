"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"

export type ThemeMode = "default" | "warm" | "dark"

interface ThemeContextType {
  theme: ThemeMode
  setTheme: (theme: ThemeMode) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export const themeConfig: Record<ThemeMode, {
  name: string
  description: string
  background: string
  previewGradient: string
  textColor: string
  cardBg: string
  cardBorder: string
  mutedText: string
  sidebarBg: string
  sidebarBorder: string
}> = {
  default: {
    name: "Default",
    description: "Classic white and pink gradient",
    background: "bg-gradient-to-br from-white via-pink-50/30 to-white",
    previewGradient: "linear-gradient(135deg, #ffffff 0%, #fdf2f8 50%, #ffffff 100%)",
    textColor: "text-gray-900",
    cardBg: "bg-white",
    cardBorder: "border-gray-200",
    mutedText: "text-gray-600",
    sidebarBg: "bg-white",
    sidebarBorder: "border-gray-200",
  },
  warm: {
    name: "Warm",
    description: "Soft blue and pink tones",
    background: "bg-gradient-to-br from-blue-50 via-pink-50/40 to-blue-50/60",
    previewGradient: "linear-gradient(135deg, #eff6ff 0%, #fdf2f8 50%, #dbeafe 100%)",
    textColor: "text-gray-900",
    cardBg: "bg-white/80",
    cardBorder: "border-blue-100",
    mutedText: "text-gray-600",
    sidebarBg: "bg-white/90",
    sidebarBorder: "border-blue-100",
  },
  dark: {
    name: "Dark",
    description: "Elegant dark with pink accents",
    background: "bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900",
    previewGradient: "linear-gradient(135deg, #111827 0%, #1f2937 50%, #111827 100%)",
    textColor: "text-gray-100",
    cardBg: "bg-gray-800/80",
    cardBorder: "border-gray-700",
    mutedText: "text-gray-400",
    sidebarBg: "bg-gray-900",
    sidebarBorder: "border-gray-800",
  },
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<ThemeMode>("default")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const savedTheme = localStorage.getItem("bloom-theme") as ThemeMode
    if (savedTheme && themeConfig[savedTheme]) {
      setTheme(savedTheme)
    }
  }, [])

  useEffect(() => {
    if (mounted) {
      localStorage.setItem("bloom-theme", theme)
    }
  }, [theme, mounted])

  if (!mounted) {
    return <>{children}</>
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  // Return default values if context is not available (for SSR or when used outside provider)
  if (context === undefined) {
    return {
      theme: "default" as ThemeMode,
      setTheme: () => {},
    }
  }
  return context
}

