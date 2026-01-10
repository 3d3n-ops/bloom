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
  Wrench,
  Layers,
  Brain,
  Network,
  ChevronDown
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useState } from "react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { NewFolderModal } from "@/components/new-folder-modal"
import { useClerk } from "@clerk/nextjs"
import { useFolders } from "@/hooks/use-folders"

export function Sidebar() {
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [showNewFolderModal, setShowNewFolderModal] = useState(false)
  const [isToolsExpanded, setIsToolsExpanded] = useState(true)
  const { signOut } = useClerk()
  const { fetchFolders } = useFolders()

  const navigation = [
    { name: "Home", href: "/app", icon: Home, onClick: undefined },
    { name: "New folder", href: "#", icon: FolderPlus, onClick: () => setShowNewFolderModal(true) },
  ]

  const toolsNavigation = [
    { name: "Flashcards", href: "/app/tools/flashcards", icon: Layers },
    { name: "Quizzes", href: "/app/tools/quizzes", icon: Brain },
    { name: "Knowledge Graph", href: "/app/tools/graph", icon: Network },
  ]

  const bottomNavigation = [
    { name: "Settings", href: "/app/settings", icon: Settings },
    { name: "Help Center", href: "/app/help", icon: HelpCircle },
  ]
  
  const sidebarContent = (
    <>
      <div className="p-6 border-b border-gray-200 flex items-center justify-between">
        <Link href="/app" className="flex items-center gap-2">
          <span className="text-2xl">🌸</span>
          {!isCollapsed && <span className="text-xl font-semibold" style={{ color: "#3D0026" }}>Bloom</span>}
        </Link>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden md:flex p-1 hover:bg-gray-100 rounded transition-colors"
        >
          <ChevronLeft className={cn("h-4 w-4 transition-transform", isCollapsed && "rotate-180")} />
        </button>
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
                  "text-gray-600 hover:bg-gray-50"
                )}
                title={isCollapsed ? item.name : undefined}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                {!isCollapsed && <span className="text-sm font-medium">{item.name}</span>}
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
                  ? "bg-pink-50 text-pink-600"
                  : "text-gray-600 hover:bg-gray-50"
              )}
              title={isCollapsed ? item.name : undefined}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {!isCollapsed && <span className="text-sm font-medium">{item.name}</span>}
            </Link>
          )
        })}

        {/* Tools Section */}
        <div className="pt-2">
          <button
            onClick={() => !isCollapsed && setIsToolsExpanded(!isToolsExpanded)}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors w-full",
              isCollapsed ? "justify-center" : "justify-between",
              pathname.startsWith("/app/tools")
                ? "bg-gradient-to-r from-purple-50 to-pink-50 text-purple-600"
                : "text-gray-600 hover:bg-gray-50"
            )}
            title={isCollapsed ? "Tools" : undefined}
          >
            <div className="flex items-center gap-3">
              <Wrench className="h-5 w-5 flex-shrink-0" />
              {!isCollapsed && <span className="text-sm font-medium">Tools</span>}
            </div>
            {!isCollapsed && (
              <ChevronDown 
                className={cn(
                  "h-4 w-4 transition-transform duration-200",
                  isToolsExpanded ? "rotate-0" : "-rotate-90"
                )} 
              />
            )}
          </button>
          
          {/* Tools Sub-items */}
          {!isCollapsed && isToolsExpanded && (
            <div className="ml-4 mt-1 space-y-1 border-l-2 border-gray-100 pl-2">
              {toolsNavigation.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                      isActive
                        ? "bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 shadow-sm"
                        : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                    )}
                  >
                    <item.icon className={cn(
                      "h-4 w-4 flex-shrink-0",
                      isActive && "text-purple-600"
                    )} />
                    <span className="text-sm font-medium">{item.name}</span>
                  </Link>
                )
              })}
            </div>
          )}
          
          {/* Collapsed state - show tools directly */}
          {isCollapsed && (
            <div className="mt-1 space-y-1">
              {toolsNavigation.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsMobileOpen(false)}
                    className={cn(
                      "flex items-center justify-center px-4 py-2.5 rounded-lg transition-colors",
                      isActive
                        ? "bg-purple-50 text-purple-600"
                        : "text-gray-400 hover:bg-gray-50 hover:text-gray-600"
                    )}
                    title={item.name}
                  >
                    <item.icon className="h-4 w-4" />
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="my-3 border-t border-gray-100" />

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
                  ? "bg-pink-50 text-pink-600"
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
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={() => signOut({ redirectUrl: "/" })}
          className={cn(
            "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors w-full text-gray-600 hover:bg-red-50 hover:text-red-600",
            isCollapsed ? "justify-center" : ""
          )}
          title={isCollapsed ? "Sign out" : undefined}
        >
          <LogOut className="h-5 w-5 flex-shrink-0" />
          {!isCollapsed && <span className="text-sm font-medium">Sign out</span>}
        </button>
      </div>
    </>
  )
  
  return (
    <>
      {/* Desktop Sidebar */}
      <div className={cn(
        "hidden md:flex bg-white border-r border-gray-200 flex-col h-screen transition-all duration-300",
        isCollapsed ? "w-20" : "w-64"
      )}>
        {sidebarContent}
      </div>
      
      {/* Mobile Sidebar */}
      <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
        <SheetTrigger asChild>
          <button className="md:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md border border-gray-200">
            <Menu className="h-5 w-5" />
          </button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
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

