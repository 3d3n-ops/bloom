"use client"

import { Sidebar } from "@/components/sidebar"
import { Network, Sparkles, ZoomIn, ZoomOut, Maximize2 } from "lucide-react"

export default function KnowledgeGraphPage() {
  return (
    <div className="flex h-screen bg-gradient-to-br from-white via-pink-50/30 to-white">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Header */}
        <header className="px-8 py-6 border-b border-gray-200 bg-white/80 backdrop-blur-sm z-10">
          <div className="flex items-center justify-between max-w-4xl mx-auto w-full">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-pink-400 to-pink-500 shadow-lg shadow-pink-500/20">
                <Network className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Knowledge Graph</h1>
                <p className="text-gray-500 text-sm">Visualize connections between your notes</p>
              </div>
            </div>
            
            {/* Zoom Controls */}
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <button className="p-3 text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors">
                  <ZoomIn className="h-4 w-4" />
                </button>
                <div className="w-px h-6 bg-gray-200" />
                <button className="p-3 text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors">
                  <ZoomOut className="h-4 w-4" />
                </button>
                <div className="w-px h-6 bg-gray-200" />
                <button className="p-3 text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors">
                  <Maximize2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Graph Canvas Area */}
        <main className="flex-1 flex items-center justify-center p-8">
          {/* Empty State */}
          <div className="flex flex-col items-center justify-center text-center max-w-md">
            <div className="relative mb-8">
              {/* Animated graph preview */}
              <div className="w-48 h-48 relative">
                {/* Center node */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-gradient-to-br from-pink-400 to-pink-500 shadow-lg shadow-pink-500/30 animate-pulse" />
                
                {/* Orbiting nodes */}
                {[0, 60, 120, 180, 240, 300].map((angle, i) => {
                  const radius = 70
                  const x = Math.cos((angle * Math.PI) / 180) * radius
                  const y = Math.sin((angle * Math.PI) / 180) * radius
                  const colors = [
                    "from-violet-400 to-purple-500",
                    "from-pink-400 to-rose-500",
                    "from-cyan-400 to-blue-500",
                    "from-emerald-400 to-green-500",
                    "from-amber-400 to-yellow-500",
                    "from-red-400 to-rose-500",
                  ]
                  return (
                    <div key={angle}>
                      {/* Connection line */}
                      <div
                        className="absolute top-1/2 left-1/2 h-px bg-gradient-to-r from-gray-300 to-transparent origin-left"
                        style={{
                          width: radius,
                          transform: `rotate(${angle}deg)`,
                        }}
                      />
                      {/* Node */}
                      <div
                        className={`absolute w-5 h-5 rounded-full bg-gradient-to-br ${colors[i]} shadow-lg opacity-60`}
                        style={{
                          top: `calc(50% + ${y}px)`,
                          left: `calc(50% + ${x}px)`,
                          transform: "translate(-50%, -50%)",
                          animation: `pulse 2s ease-in-out ${i * 0.3}s infinite`,
                        }}
                      />
                    </div>
                  )
                })}
              </div>
            </div>
            
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">Coming Soon</h2>
            <p className="text-gray-500 mb-6">
              Explore the connections between your notes with an interactive knowledge graph. Discover patterns and relationships you never knew existed.
            </p>
            
            <div className="flex items-center gap-3 px-4 py-3 bg-pink-50 rounded-xl border border-pink-200">
              <Sparkles className="h-5 w-5 text-pink-500" />
              <span className="text-sm text-gray-700">AI-powered connection discovery</span>
            </div>
          </div>
        </main>

        {/* Background Grid Pattern */}
        <div 
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: `
              linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)
            `,
            backgroundSize: "50px 50px",
          }}
        />
      </div>
    </div>
  )
}
