"use client"

import Image from "next/image"

// Composition notebook image icon
export function NotebookIcon({ 
  className = "", 
  priority = false 
}: { 
  className?: string
  priority?: boolean 
}) {
  return (
    <div className={`relative ${className}`} style={{ aspectRatio: '28/36', width: '100%', height: '100%' }}>
      <Image
        src="/notebook.png"
        alt="Notebook cover"
        fill
        sizes="112px"
        className="object-contain drop-shadow-md"
        priority={priority}
        quality={85}
        fetchPriority={priority ? "high" : "auto"}
        loading={priority ? undefined : "lazy"}
      />
    </div>
  )
}

// Lined paper with pencil image icon
export function NoteIcon({ 
  className = "", 
  priority = false 
}: { 
  className?: string
  priority?: boolean 
}) {
  return (
    <div className={`relative ${className}`} style={{ aspectRatio: '28/36', width: '100%', height: '100%' }}>
      <Image
        src="/note_image.png"
        alt="Note page"
        fill
        sizes="112px"
        className="object-contain drop-shadow-md"
        priority={priority}
        quality={85}
        fetchPriority={priority ? "high" : "auto"}
        loading={priority ? undefined : "lazy"}
      />
    </div>
  )
}

