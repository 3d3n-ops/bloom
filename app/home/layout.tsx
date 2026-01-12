"use client"

import { ProfileSync } from "@/components/profile-sync"
import { ThemeProvider, useTheme, themeConfig } from "@/contexts/theme-context"

function ThemedLayout({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme()
  const config = themeConfig[theme]

  return (
    <div className={`min-h-screen transition-colors duration-500 ${config.background}`}>
      <ProfileSync />
      {children}
    </div>
  )
}

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ThemeProvider>
      <ThemedLayout>{children}</ThemedLayout>
    </ThemeProvider>
  )
}

