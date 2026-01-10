"use client"

import { useEffect, useState } from "react"

interface MacNoteCardProps {
  title: string
  content: React.ReactNode
  className?: string
  delay?: number
  rotation?: number
  offsetX?: number
  offsetY?: number
}

export function MacNoteCard({
  title,
  content,
  className = "",
  delay = 0,
  rotation = 0,
  offsetX = 0,
  offsetY = 0,
}: MacNoteCardProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, delay)
    return () => clearTimeout(timer)
  }, [delay])

  return (
    <div
      className={`mac-note-card ${isVisible ? "is-visible" : ""} ${className}`}
      style={{
        "--rotation": `${rotation}deg`,
        "--offset-x": `${offsetX}px`,
        "--offset-y": `${offsetY}px`,
        "--delay": `${delay}ms`,
      } as React.CSSProperties}
    >
      {/* Mac window header */}
      <div className="mac-header">
        <div className="traffic-lights">
          <span className="light red" />
          <span className="light yellow" />
          <span className="light green" />
        </div>
        <span className="mac-title">{title}</span>
        <div className="header-spacer" />
      </div>

      {/* Editor content area */}
      <div className="note-content">
        {content}
      </div>
    </div>
  )
}

// Pre-styled note content components for various subjects
export function BiologyNoteContent() {
  return (
    <div className="prose-preview">
      <h2>Cell Division & Mitosis</h2>
      <p>
        The cell cycle consists of <strong>interphase</strong> and <strong>mitotic phase</strong>. 
        During interphase, the cell grows and replicates its DNA.
      </p>
      <ul>
        <li><span className="highlight-yellow">Prophase</span> — Chromatin condenses into chromosomes</li>
        <li><span className="highlight-pink">Metaphase</span> — Chromosomes align at cell equator</li>
        <li><span className="highlight-green">Anaphase</span> — Sister chromatids separate</li>
        <li><span className="highlight-purple">Telophase</span> — Nuclear envelopes reform</li>
      </ul>
      <blockquote>
        "All cells arise from pre-existing cells" — Rudolf Virchow
      </blockquote>
    </div>
  )
}

export function CalculusNoteContent() {
  return (
    <div className="prose-preview">
      <h2>Derivatives & Integration</h2>
      <p>
        The derivative measures the <strong>rate of change</strong> of a function at any point.
      </p>
      <div className="math-block">
        <code>f&apos;(x) = lim(h→0) [f(x+h) - f(x)] / h</code>
      </div>
      <h3>Key Rules:</h3>
      <ul>
        <li><strong>Power Rule:</strong> d/dx[xⁿ] = nxⁿ⁻¹</li>
        <li><strong>Product Rule:</strong> (fg)&apos; = f&apos;g + fg&apos;</li>
        <li><strong>Chain Rule:</strong> (f∘g)&apos; = f&apos;(g) · g&apos;</li>
      </ul>
      <p className="text-sm text-gray-500">
        ✨ Integration is the reverse of differentiation
      </p>
    </div>
  )
}

export function LiteratureNoteContent() {
  return (
    <div className="prose-preview">
      <h2>Shakespeare&apos;s Hamlet</h2>
      <p>
        Themes of <em>revenge</em>, <em>mortality</em>, and <em>corruption</em> 
        permeate the tragedy.
      </p>
      <blockquote>
        "To be, or not to be, that is the question—<br />
        Whether &apos;tis nobler in the mind to suffer<br />
        The slings and arrows of outrageous fortune..."
      </blockquote>
      <h3>Character Analysis:</h3>
      <ul>
        <li><strong>Hamlet</strong> — Tragic hero, paralyzed by indecision</li>
        <li><strong>Claudius</strong> — The usurper king, morally corrupt</li>
        <li><strong>Ophelia</strong> — Symbol of innocence destroyed</li>
      </ul>
    </div>
  )
}

export function ChemistryNoteContent() {
  return (
    <div className="prose-preview">
      <h2>Chemical Bonding</h2>
      <p>
        Atoms bond to achieve <span className="highlight-yellow">stable electron configurations</span>.
      </p>
      <h3>Types of Bonds:</h3>
      <ul>
        <li><strong>Ionic</strong> — Transfer of electrons (NaCl)</li>
        <li><strong>Covalent</strong> — Sharing of electrons (H₂O)</li>
        <li><strong>Metallic</strong> — Sea of delocalized electrons</li>
      </ul>
      <div className="formula-box">
        <span>H₂O</span>
        <span>•</span>
        <span>CO₂</span>
        <span>•</span>
        <span>NaCl</span>
      </div>
      <p className="text-sm">
        🌸 Electronegativity determines bond polarity
      </p>
    </div>
  )
}

export function HistoryNoteContent() {
  return (
    <div className="prose-preview">
      <h2>The French Revolution</h2>
      <p>
        <strong>1789-1799</strong> — A period of radical political and societal change in France.
      </p>
      <h3>Key Events:</h3>
      <ul>
        <li><span className="highlight-pink">1789</span> — Storming of the Bastille</li>
        <li><span className="highlight-yellow">1791</span> — Declaration of the Rights of Man</li>
        <li><span className="highlight-purple">1793</span> — Reign of Terror begins</li>
      </ul>
      <blockquote>
        "Liberté, égalité, fraternité"
      </blockquote>
      <p className="text-sm text-gray-500">
        The revolution inspired democratic movements worldwide ✨
      </p>
    </div>
  )
}

