"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  Home, 
  FolderPlus, 
  Settings, 
  HelpCircle, 
  Menu, 
  ChevronLeft, 
  LogOut,
  Network
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useState } from "react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { NewFolderModal } from "@/components/new-folder-modal"
import { useClerk } from "@clerk/nextjs"
import { useFolders } from "@/hooks/use-folders"
import { useTheme } from "@/contexts/theme-context"

export function Sidebar() {
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [showNewFolderModal, setShowNewFolderModal] = useState(false)
  const { signOut } = useClerk()
  const { fetchFolders } = useFolders()
  const { theme } = useTheme()
  const isDark = theme === "dark"

  const navigation = [
    { name: "Home", href: "/app", icon: Home, onClick: undefined },
    { name: "New notebook", href: "#", icon: FolderPlus, onClick: () => setShowNewFolderModal(true) },
    { name: "Knowledge Graph", href: "/app/tools/graph", icon: Network, onClick: undefined },
  ]

  const bottomNavigation = [
    { name: "Settings", href: "/app/settings", icon: Settings },
    { name: "Help Center", href: "/app/help", icon: HelpCircle },
  ]
  
  const sidebarContent = (
    <>
      <div 
        className={cn(
          "border-b flex items-center relative",
          isDark ? "border-gray-700" : "border-gray-200",
          isCollapsed ? "justify-center" : "justify-between"
        )}
        style={{
          padding: isCollapsed ? "1rem" : "1.5rem",
          transition: "padding 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)"
        }}
      >
        {isCollapsed ? (
          <button
            onClick={() => setIsCollapsed(false)}
            className="flex items-center justify-center flex-shrink-0 cursor-pointer"
          >
            <img 
              src="/bloom-logo.svg" 
              alt="Bloom" 
              className="w-8 h-8 flex-shrink-0"
            />
          </button>
        ) : (
          <>
            <Link href="/app" className="flex items-center gap-2 flex-shrink-0">
              <img 
                src="/bloom-logo.svg" 
                alt="Bloom" 
                className="w-8 h-8 flex-shrink-0"
              />
              <span 
                className="text-xl font-semibold whitespace-nowrap transition-all duration-300 ease-out"
                style={{ 
                  color: isDark ? "#f9a8d4" : "#3D0026",
                  transition: "opacity 0.3s cubic-bezier(0.4, 0.0, 0.2, 1), transform 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)"
                }}
              >
                Bloom
              </span>
            </Link>
            <button
              onClick={() => setIsCollapsed(true)}
              className={cn(
                "hidden md:flex p-1 rounded transition-colors flex-shrink-0",
                isDark ? "hover:bg-gray-700 text-gray-400" : "hover:bg-gray-100"
              )}
            >
              <ChevronLeft className="h-4 w-4 transition-transform" />
            </button>
          </>
        )}
      </div>
      
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {/* Main Navigation */}
        {navigation.map((item) => {
          const isActive = pathname === item.href
          
          if (item.onClick) {
            return (
              <button
                key={item.name}
                onClick={() => {
                  item.onClick()
                  setIsMobileOpen(false)
                }}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors w-full",
                  isCollapsed ? "justify-center" : "",
                  isDark 
                    ? "text-gray-400 hover:bg-gray-700 hover:text-gray-200" 
                    : "text-gray-600 hover:bg-gray-50"
                )}
                title={isCollapsed ? item.name : undefined}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                {!isCollapsed && (
                  <span 
                    className="text-sm font-medium transition-all duration-300 ease-out"
                    style={{
                      transition: "opacity 0.25s cubic-bezier(0.4, 0.0, 0.2, 1) 0.05s, transform 0.25s cubic-bezier(0.4, 0.0, 0.2, 1) 0.05s"
                    }}
                  >
                    {item.name}
                  </span>
                )}
              </button>
            )
          }
          
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => setIsMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                isCollapsed ? "justify-center" : "",
                isActive
                  ? isDark 
                    ? "bg-pink-900/30 text-pink-400" 
                    : "bg-pink-50 text-pink-600"
                  : isDark 
                    ? "text-gray-400 hover:bg-gray-700 hover:text-gray-200" 
                    : "text-gray-600 hover:bg-gray-50"
              )}
              title={isCollapsed ? item.name : undefined}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {!isCollapsed && <span className="text-sm font-medium">{item.name}</span>}
            </Link>
          )
        })}

        {/* Divider */}
        <div className={cn("my-3 border-t", isDark ? "border-gray-700" : "border-gray-100")} />

        {/* Bottom Navigation */}
        {bottomNavigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => setIsMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                isCollapsed ? "justify-center" : "",
                isActive
                  ? isDark 
                    ? "bg-pink-900/30 text-pink-400"
                    : "bg-pink-50 text-pink-600"
                  : isDark 
                    ? "text-gray-400 hover:bg-gray-700 hover:text-gray-200"
                    : "text-gray-600 hover:bg-gray-50"
              )}
              title={isCollapsed ? item.name : undefined}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {!isCollapsed && <span className="text-sm font-medium">{item.name}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Sign Out */}
      <div className={cn("p-4 border-t", isDark ? "border-gray-700" : "border-gray-200")}>
        <button
          onClick={() => signOut({ redirectUrl: "/" })}
          className={cn(
            "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors w-full",
            isDark 
              ? "text-gray-400 hover:bg-red-900/30 hover:text-red-400"
              : "text-gray-600 hover:bg-red-50 hover:text-red-600",
            isCollapsed ? "justify-center" : ""
          )}
          title={isCollapsed ? "Sign out" : undefined}
        >
          <LogOut className="h-5 w-5 flex-shrink-0" />
          {!isCollapsed && (
            <span 
              className="text-sm font-medium transition-all duration-300 ease-out"
              style={{
                transition: "opacity 0.25s cubic-bezier(0.4, 0.0, 0.2, 1) 0.05s, transform 0.25s cubic-bezier(0.4, 0.0, 0.2, 1) 0.05s"
              }}
            >
              Sign out
            </span>
          )}
        </button>
      </div>
    </>
  )
  
  return (
    <>
      {/* Desktop Sidebar */}
      <div 
        className={cn(
          "hidden md:flex border-r flex-col h-screen",
          isDark ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200",
          isCollapsed ? "w-20" : "w-64"
        )}
        style={{
          transition: "width 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
        }}
      >
        {sidebarContent}
      </div>
      
      {/* Mobile Sidebar */}
      <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
        <SheetTrigger asChild>
          <button className={cn(
            "md:hidden fixed top-4 left-4 z-50 p-2 rounded-lg shadow-md border",
            isDark 
              ? "bg-gray-800 border-gray-700 text-gray-200"
              : "bg-white border-gray-200"
          )}>
            <Menu className="h-5 w-5" />
          </button>
        </SheetTrigger>
        <SheetContent side="left" className={cn("w-64 p-0", isDark ? "bg-gray-900" : "")}>
          <div className="flex flex-col h-full">
            {sidebarContent}
          </div>
        </SheetContent>
      </Sheet>

      <NewFolderModal 
        isOpen={showNewFolderModal} 
        onClose={() => setShowNewFolderModal(false)}
        onFolderCreated={fetchFolders}
      />
    </>
  )
}
