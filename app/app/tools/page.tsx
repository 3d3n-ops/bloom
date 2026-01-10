"use client"

import { Sidebar } from "@/components/sidebar"
import Link from "next/link"
import { Layers, Brain, Network, Sparkles } from "lucide-react"

const tools = [
  {
    name: "Flashcards",
    description: "Generate smart flashcards from your notes for effective studying",
    href: "/app/tools/flashcards",
    icon: Layers,
    gradient: "from-pink-400 to-pink-500",
    bgGradient: "from-pink-50 to-white",
  },
  {
    name: "Quizzes",
    description: "Test your knowledge with AI-generated quizzes from your notes",
    href: "/app/tools/quizzes",
    icon: Brain,
    gradient: "from-pink-500 to-rose-500",
    bgGradient: "from-rose-50 to-white",
  },
  {
    name: "Knowledge Graph",
    description: "Visualize connections between your notes and discover patterns",
    href: "/app/tools/graph",
    icon: Network,
    gradient: "from-pink-400 to-pink-600",
    bgGradient: "from-pink-50 to-white",
  },
]

export default function ToolsPage() {
  return (
    <div className="flex h-screen bg-gradient-to-br from-white via-pink-50/30 to-white">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-auto">
        <main className="flex-1 p-8 max-w-5xl mx-auto w-full">
          {/* Header */}
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-xl bg-gradient-to-br from-pink-400 to-pink-500 shadow-lg shadow-pink-500/20">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-4xl font-bold text-gray-900">Study Tools</h1>
            </div>
            <p className="text-gray-500 text-lg ml-14">
              Supercharge your learning with AI-powered study tools
            </p>
          </div>

          {/* Tools Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tools.map((tool) => (
              <Link key={tool.name} href={tool.href}>
                <div className={`group relative h-64 bg-gradient-to-br ${tool.bgGradient} border border-gray-200 rounded-3xl p-6 hover:shadow-xl hover:shadow-pink-500/10 transition-all duration-300 hover:-translate-y-1 cursor-pointer overflow-hidden`}>
                  {/* Background decoration */}
                  <div className={`absolute -right-8 -bottom-8 w-32 h-32 bg-gradient-to-br ${tool.gradient} rounded-full opacity-10 group-hover:opacity-20 transition-opacity`} />
                  <div className={`absolute -right-4 -bottom-4 w-24 h-24 bg-gradient-to-br ${tool.gradient} rounded-full opacity-10 group-hover:opacity-20 transition-opacity`} />
                  
                  {/* Icon */}
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${tool.gradient} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <tool.icon className="h-7 w-7 text-white" />
                  </div>
                  
                  {/* Content */}
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {tool.name}
                  </h3>
                  <p className="text-gray-500 text-sm leading-relaxed">
                    {tool.description}
                  </p>
                  
                  {/* Arrow indicator */}
                  <div className="absolute bottom-6 right-6 w-8 h-8 rounded-full bg-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-sm border border-gray-100">
                    <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Coming soon note */}
          <div className="mt-10 text-center">
            <p className="text-gray-400 text-sm">
              More study tools coming soon • Powered by AI ✨
            </p>
          </div>
        </main>
      </div>
    </div>
  )
}
