"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import { Sidebar } from "@/components/sidebar"
import { 
  Network, 
  Sparkles, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  RefreshCw,
  Loader2,
  X,
  ExternalLink,
  Circle
} from "lucide-react"

// Dynamically import ForceGraph2D to avoid SSR issues
const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full">
      <Loader2 className="h-8 w-8 text-pink-400 animate-spin" />
    </div>
  )
})

interface GraphNode {
  id: string
  title: string
  folderId: string | null
  folderName: string | null
  hasEmbedding: boolean
  connectionCount: number
  // Force graph properties
  x?: number
  y?: number
  vx?: number
  vy?: number
}

interface GraphEdge {
  source: string | GraphNode
  target: string | GraphNode
  similarity: number
  strength: "strong" | "moderate" | "weak"
}

interface GraphData {
  nodes: GraphNode[]
  edges: GraphEdge[]
  stats: {
    totalNotes: number
    notesWithEmbeddings: number
    totalConnections: number
    strongConnections: number
  }
}

// Folder color palette - vibrant, distinct colors
const FOLDER_COLORS = [
  "#f472b6", // pink
  "#a78bfa", // purple
  "#60a5fa", // blue
  "#34d399", // emerald
  "#fbbf24", // amber
  "#fb923c", // orange
  "#f87171", // red
  "#2dd4bf", // teal
  "#a3e635", // lime
  "#e879f9", // fuchsia
]

export default function KnowledgeGraphPage() {
  const router = useRouter()
  const graphRef = useRef<{ zoomIn: () => void; zoomOut: () => void; centerAt: (x: number, y: number, ms: number) => void } | null>(null)
  
  const [graphData, setGraphData] = useState<GraphData | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null)
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null)
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 })

  // Folder to color mapping
  const [folderColors, setFolderColors] = useState<Map<string, string>>(new Map())

  // Fetch graph data
  const fetchGraph = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/graph")
      if (!res.ok) throw new Error("Failed to fetch graph")
      const data: GraphData = await res.json()
      setGraphData(data)

      // Build folder color mapping
      const folders = new Set(data.nodes.map(n => n.folderId).filter(Boolean) as string[])
      const colorMap = new Map<string, string>()
      let colorIndex = 0
      folders.forEach(folderId => {
        colorMap.set(folderId, FOLDER_COLORS[colorIndex % FOLDER_COLORS.length])
        colorIndex++
      })
      setFolderColors(colorMap)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }, [])

  // Generate embeddings for all notes
  const generateEmbeddings = useCallback(async () => {
    setGenerating(true)
    try {
      const res = await fetch("/api/graph/embed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batchAll: true })
      })
      if (!res.ok) throw new Error("Failed to generate embeddings")
      // Refresh graph after generation
      await fetchGraph()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate")
    } finally {
      setGenerating(false)
    }
  }, [fetchGraph])

  // Handle window resize
  useEffect(() => {
    const updateDimensions = () => {
      const container = document.getElementById("graph-container")
      if (container) {
        setDimensions({
          width: container.clientWidth,
          height: container.clientHeight
        })
      }
    }
    
    updateDimensions()
    window.addEventListener("resize", updateDimensions)
    return () => window.removeEventListener("resize", updateDimensions)
  }, [])

  // Initial fetch
  useEffect(() => {
    fetchGraph()
  }, [fetchGraph])

  // Get node color based on folder
  const getNodeColor = useCallback((node: GraphNode) => {
    if (!node.hasEmbedding) return "#cbd5e1" // gray for nodes without embeddings
    if (node.folderId && folderColors.has(node.folderId)) {
      return folderColors.get(node.folderId)!
    }
    return "#f472b6" // default pink
  }, [folderColors])

  // Get edge color based on strength
  const getEdgeColor = useCallback((edge: GraphEdge) => {
    switch (edge.strength) {
      case "strong": return "rgba(244, 114, 182, 0.8)" // pink
      case "moderate": return "rgba(167, 139, 250, 0.5)" // purple
      case "weak": return "rgba(148, 163, 184, 0.3)" // gray
      default: return "rgba(148, 163, 184, 0.3)"
    }
  }, [])

  // Get edge width based on strength
  const getEdgeWidth = useCallback((edge: GraphEdge) => {
    switch (edge.strength) {
      case "strong": return 3
      case "moderate": return 2
      case "weak": return 1
      default: return 1
    }
  }, [])

  // Node size based on connections
  const getNodeSize = useCallback((node: GraphNode) => {
    const base = 6
    const connectionBonus = Math.min(node.connectionCount * 1.5, 12)
    return base + connectionBonus
  }, [])

  // Navigate to note
  const handleNodeClick = useCallback((node: GraphNode) => {
    setSelectedNode(node)
  }, [])

  const openNote = useCallback((nodeId: string) => {
    router.push(`/app/note/${nodeId}`)
  }, [router])

  // Check if there are notes without embeddings
  const needsEmbeddings = graphData && graphData.stats.notesWithEmbeddings < graphData.stats.totalNotes

  // Render empty state
  if (!loading && (!graphData || graphData.nodes.length === 0)) {
    return (
      <div className="flex h-screen bg-gradient-to-br from-white via-pink-50/30 to-white">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden relative">
          <header className="px-8 py-6 border-b border-gray-200 bg-white/80 backdrop-blur-sm z-10">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-pink-400 to-pink-500 shadow-lg shadow-pink-500/20">
                <Network className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Knowledge Graph</h1>
                <p className="text-gray-500 text-sm">Visualize connections between your notes</p>
              </div>
            </div>
          </header>
          <main className="flex-1 flex items-center justify-center p-8">
            <div className="flex flex-col items-center justify-center text-center max-w-md">
              <div className="w-20 h-20 rounded-full bg-pink-100 flex items-center justify-center mb-6">
                <Network className="h-10 w-10 text-pink-400" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">No Notes Yet</h2>
              <p className="text-gray-500 mb-6">
                Create some notes to start building your knowledge graph. The more notes you have, the more connections you&apos;ll discover!
              </p>
            </div>
          </main>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-white via-pink-50/30 to-white">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Header */}
        <header className="px-6 py-4 border-b border-gray-200 bg-white/80 backdrop-blur-sm z-20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-pink-400 to-pink-500 shadow-lg shadow-pink-500/20">
                <Network className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Knowledge Graph</h1>
                <p className="text-gray-500 text-sm">
                  {graphData ? (
                    <>
                      {graphData.stats.totalNotes} notes · {graphData.stats.totalConnections} connections
                    </>
                  ) : (
                    "Loading..."
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Generate embeddings button */}
              {needsEmbeddings && (
                <button
                  onClick={generateEmbeddings}
                  disabled={generating}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl text-sm font-medium hover:from-pink-600 hover:to-rose-600 transition-all disabled:opacity-50 shadow-lg shadow-pink-500/20"
                >
                  {generating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  {generating ? "Generating..." : `Analyze ${graphData!.stats.totalNotes - graphData!.stats.notesWithEmbeddings} notes`}
                </button>
              )}

              {/* Refresh button */}
              <button
                onClick={fetchGraph}
                disabled={loading}
                className="p-2.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
                title="Refresh graph"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              </button>

              {/* Zoom controls */}
              <div className="flex items-center bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <button 
                  onClick={() => graphRef.current?.zoomIn()}
                  className="p-2.5 text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <ZoomIn className="h-4 w-4" />
                </button>
                <div className="w-px h-5 bg-gray-200" />
                <button 
                  onClick={() => graphRef.current?.zoomOut()}
                  className="p-2.5 text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <ZoomOut className="h-4 w-4" />
                </button>
                <div className="w-px h-5 bg-gray-200" />
                <button 
                  onClick={() => graphRef.current?.centerAt(0, 0, 400)}
                  className="p-2.5 text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Maximize2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Graph Canvas */}
        <main id="graph-container" className="flex-1 relative">
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="h-8 w-8 text-pink-400 animate-spin" />
            </div>
          ) : error ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <p className="text-red-500 mb-4">{error}</p>
                <button
                  onClick={fetchGraph}
                  className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
                >
                  Try Again
                </button>
              </div>
            </div>
          ) : graphData && (
            <ForceGraph2D
              ref={graphRef as React.Ref<never>}
              width={dimensions.width}
              height={dimensions.height}
              graphData={{
                nodes: graphData.nodes,
                links: graphData.edges
              }}
              nodeId="id"
              nodeLabel={(node) => (node as GraphNode).title}
              nodeColor={(node) => getNodeColor(node as GraphNode)}
              nodeVal={(node) => getNodeSize(node as GraphNode)}
              nodeCanvasObject={(node, ctx, globalScale) => {
                const n = node as GraphNode
                const size = getNodeSize(n)
                const color = getNodeColor(n)
                const isHovered = hoveredNode?.id === n.id
                const isSelected = selectedNode?.id === n.id
                
                // Draw glow for hovered/selected
                if (isHovered || isSelected) {
                  ctx.beginPath()
                  ctx.arc(node.x!, node.y!, size + 4, 0, 2 * Math.PI)
                  ctx.fillStyle = `${color}40`
                  ctx.fill()
                }
                
                // Draw node
                ctx.beginPath()
                ctx.arc(node.x!, node.y!, size, 0, 2 * Math.PI)
                ctx.fillStyle = color
                ctx.fill()
                
                // Draw border
                ctx.strokeStyle = isSelected ? "#374151" : "rgba(255,255,255,0.6)"
                ctx.lineWidth = isSelected ? 2 : 1
                ctx.stroke()
                
                // Draw label if zoomed in enough
                if (globalScale > 0.8) {
                  const label = n.title.length > 20 ? n.title.slice(0, 18) + "..." : n.title
                  const fontSize = Math.max(10, 12 / globalScale)
                  ctx.font = `${fontSize}px Inter, system-ui, sans-serif`
                  ctx.textAlign = "center"
                  ctx.textBaseline = "top"
                  ctx.fillStyle = "#374151"
                  ctx.fillText(label, node.x!, node.y! + size + 4)
                }
              }}
              linkColor={(link) => getEdgeColor(link as GraphEdge)}
              linkWidth={(link) => getEdgeWidth(link as GraphEdge)}
              linkDirectionalParticles={2}
              linkDirectionalParticleWidth={(link) => (link as GraphEdge).strength === "strong" ? 2 : 0}
              linkDirectionalParticleColor={() => "#f472b6"}
              onNodeClick={(node) => handleNodeClick(node as GraphNode)}
              onNodeHover={(node) => setHoveredNode(node as GraphNode | null)}
              backgroundColor="transparent"
              cooldownTicks={100}
              d3AlphaDecay={0.02}
              d3VelocityDecay={0.3}
            />
          )}

          {/* Legend */}
          {graphData && graphData.nodes.length > 0 && (
            <div className="absolute bottom-6 left-6 bg-white/95 backdrop-blur-sm rounded-xl border border-gray-200 shadow-lg p-4 z-10">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Legend</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <div className="w-3 h-0.5 bg-pink-400 rounded" style={{ height: "3px" }} />
                  <span>Strong connection (&gt;75%)</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <div className="w-3 h-0.5 bg-purple-400/70 rounded" style={{ height: "2px" }} />
                  <span>Moderate (60-75%)</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <div className="w-3 h-0.5 bg-gray-400/50 rounded" style={{ height: "1px" }} />
                  <span>Weak (45-60%)</span>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-xs text-gray-500">Node size = # of connections</p>
                </div>
              </div>
              
              {/* Folder colors */}
              {folderColors.size > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-xs text-gray-500 mb-2">Folders</p>
                  <div className="space-y-1.5 max-h-32 overflow-y-auto">
                    {graphData.nodes
                      .filter(n => n.folderName)
                      .reduce((acc, n) => {
                        if (!acc.find(x => x.folderId === n.folderId)) {
                          acc.push(n)
                        }
                        return acc
                      }, [] as GraphNode[])
                      .map(n => (
                        <div key={n.folderId} className="flex items-center gap-2 text-xs text-gray-600">
                          <Circle 
                            className="h-3 w-3" 
                            fill={folderColors.get(n.folderId!)} 
                            stroke="none"
                          />
                          <span className="truncate">{n.folderName}</span>
                        </div>
                      ))
                    }
                    {graphData.nodes.some(n => !n.folderId) && (
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <Circle className="h-3 w-3" fill="#f472b6" stroke="none" />
                        <span>No folder</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Selected node panel */}
          {selectedNode && (
            <div className="absolute top-6 right-6 w-80 bg-white/95 backdrop-blur-sm rounded-xl border border-gray-200 shadow-xl z-10 overflow-hidden">
              <div className="p-4 border-b border-gray-200 flex items-start justify-between">
                <div className="flex-1 min-w-0 pr-4">
                  <h3 className="text-gray-900 font-medium truncate">{selectedNode.title}</h3>
                  {selectedNode.folderName && (
                    <p className="text-sm text-gray-500 mt-0.5">{selectedNode.folderName}</p>
                  )}
                </div>
                <button
                  onClick={() => setSelectedNode(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Connections</span>
                  <span className="text-gray-900 font-medium">{selectedNode.connectionCount}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Embedding</span>
                  <span className={`font-medium ${selectedNode.hasEmbedding ? "text-emerald-600" : "text-gray-400"}`}>
                    {selectedNode.hasEmbedding ? "Generated" : "Pending"}
                  </span>
                </div>
                
                {/* Connected notes */}
                {graphData && (
                  <div className="pt-3 border-t border-gray-200">
                    <p className="text-xs text-gray-500 mb-2">Connected to:</p>
                    <div className="space-y-1.5 max-h-40 overflow-y-auto">
                      {graphData.edges
                        .filter(e => {
                          const sourceId = typeof e.source === "string" ? e.source : e.source.id
                          const targetId = typeof e.target === "string" ? e.target : e.target.id
                          return sourceId === selectedNode.id || targetId === selectedNode.id
                        })
                        .sort((a, b) => b.similarity - a.similarity)
                        .slice(0, 10)
                        .map(edge => {
                          const sourceId = typeof edge.source === "string" ? edge.source : edge.source.id
                          const targetId = typeof edge.target === "string" ? edge.target : edge.target.id
                          const connectedId = sourceId === selectedNode.id ? targetId : sourceId
                          const connectedNode = graphData.nodes.find(n => n.id === connectedId)
                          if (!connectedNode) return null
                          return (
                            <div
                              key={connectedId}
                              className="flex items-center justify-between text-xs py-1 px-2 rounded-lg hover:bg-gray-100 cursor-pointer group"
                              onClick={() => setSelectedNode(connectedNode)}
                            >
                              <span className="text-gray-700 truncate flex-1">{connectedNode.title}</span>
                              <span className="text-gray-400 ml-2">{Math.round(edge.similarity * 100)}%</span>
                            </div>
                          )
                        })
                      }
                    </div>
                  </div>
                )}
                
                <button
                  onClick={() => openNote(selectedNode.id)}
                  className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-lg text-sm font-medium hover:from-pink-600 hover:to-rose-600 transition-all"
                >
                  <ExternalLink className="h-4 w-4" />
                  Open Note
                </button>
              </div>
            </div>
          )}
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
