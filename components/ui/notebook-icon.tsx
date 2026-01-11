"use client"

// Composition notebook style icon
export function NotebookIcon({ className = "" }: { className?: string }) {
  return (
    <div className={`relative ${className}`}>
      {/* Book spine */}
      <div className="absolute left-0 top-0 bottom-0 w-2 bg-gray-800 rounded-l-sm" />
      
      {/* Main cover */}
      <div className="relative bg-gray-900 rounded-r-lg rounded-l-sm overflow-hidden shadow-lg ml-1">
        {/* Speckle pattern */}
        <div className="absolute inset-0 opacity-60">
          {[...Array(80)].map((_, i) => (
            <div
              key={i}
              className="absolute bg-white rounded-full"
              style={{
                width: `${Math.random() * 4 + 1}px`,
                height: `${Math.random() * 4 + 1}px`,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
            />
          ))}
        </div>
        
        {/* Label area */}
        <div className="relative z-10 flex items-start justify-center pt-4 pb-8 px-3">
          <div className="bg-white rounded-md w-full py-3 px-2 shadow-sm">
            <div className="space-y-1">
              <div className="h-0.5 bg-gray-200 w-full" />
              <div className="h-0.5 bg-gray-200 w-full" />
              <div className="h-0.5 bg-gray-200 w-3/4 mx-auto" />
            </div>
          </div>
        </div>
        
        {/* More speckles below label */}
        <div className="h-16" />
      </div>
      
      {/* Bottom pages effect */}
      <div className="absolute -bottom-0.5 left-2 right-1 h-1 bg-gray-100 rounded-b-sm shadow-sm" />
    </div>
  )
}

// Lined paper with pencil style icon
export function NoteIcon({ className = "" }: { className?: string }) {
  return (
    <div className={`relative ${className}`} style={{ width: '100%', height: '100%' }}>
      {/* Paper stack/shadow effect */}
      <div 
        className="absolute bg-gray-200 rounded-2xl"
        style={{ top: '4px', left: '4px', right: '0', bottom: '0' }}
      />
      
      {/* Main paper */}
      <div 
        className="absolute inset-0 bg-white rounded-2xl overflow-hidden"
        style={{ 
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          right: '4px',
          bottom: '4px'
        }}
      >
        {/* Hole punches */}
        <div className="absolute left-[10%] top-[8%] w-[8%] h-[6%] rounded-full bg-gray-300" />
        <div className="absolute left-[10%] top-[45%] w-[8%] h-[6%] rounded-full bg-gray-300" />
        <div className="absolute left-[10%] bottom-[12%] w-[8%] h-[6%] rounded-full bg-gray-300" />
        
        {/* Red margin line */}
        <div 
          className="absolute bg-red-300" 
          style={{ left: '22%', top: 0, bottom: 0, width: '1.5px' }}
        />
        
        {/* Horizontal lines */}
        {[...Array(8)].map((_, i) => (
          <div 
            key={i}
            className="absolute bg-blue-100" 
            style={{ 
              left: '22%', 
              right: '8%', 
              top: `${18 + i * 10}%`,
              height: '1px'
            }}
          />
        ))}
        
        {/* Handwriting scribbles */}
        <svg 
          className="absolute" 
          style={{ left: '26%', right: '12%', top: '16%', height: '20%' }}
          viewBox="0 0 100 20" 
          preserveAspectRatio="none"
        >
          <path 
            d="M0 8 Q 15 4, 30 8 T 60 8 T 90 8" 
            stroke="#60a5fa" 
            strokeWidth="2" 
            fill="none" 
            opacity="0.6"
          />
          <path 
            d="M0 16 Q 10 12, 25 16 T 50 16" 
            stroke="#60a5fa" 
            strokeWidth="2" 
            fill="none" 
            opacity="0.6"
          />
        </svg>
        
        {/* Bullet points area */}
        <div className="absolute" style={{ left: '26%', top: '40%' }}>
          <div className="w-2 h-2 rounded-full bg-blue-400 mb-3" />
          <div className="w-2 h-2 rounded-full bg-blue-400 mb-3" />
          <div className="w-2 h-2 rounded-full bg-blue-400 mb-3" />
          <div className="w-2 h-2 rounded-full bg-blue-400" />
        </div>
        
        {/* Page curl */}
        <div 
          className="absolute bg-gradient-to-bl from-gray-100 to-white rounded-bl-xl"
          style={{ top: 0, right: 0, width: '15%', height: '12%' }}
        />
      </div>
      
      {/* Pencil */}
      <div 
        className="absolute"
        style={{ 
          bottom: '5%', 
          right: '-5%',
          transform: 'rotate(45deg)',
          transformOrigin: 'center'
        }}
      >
        <div className="flex flex-col items-center" style={{ width: '20px' }}>
          {/* Eraser */}
          <div 
            className="rounded-t-sm" 
            style={{ 
              width: '14px', 
              height: '8px', 
              background: 'linear-gradient(to right, #f472b6, #ec4899)'
            }} 
          />
          {/* Ferrule */}
          <div 
            style={{ 
              width: '14px', 
              height: '4px', 
              background: 'linear-gradient(to right, #9ca3af, #6b7280)'
            }} 
          />
          {/* Wood body */}
          <div 
            style={{ 
              width: '14px', 
              height: '40px', 
              background: 'linear-gradient(to right, #fcd34d, #f59e0b)'
            }} 
          />
          {/* Tip */}
          <div 
            style={{
              width: 0,
              height: 0,
              borderLeft: '7px solid transparent',
              borderRight: '7px solid transparent',
              borderTop: '12px solid #d97706'
            }}
          />
          {/* Lead */}
          <div 
            style={{
              width: 0,
              height: 0,
              borderLeft: '3px solid transparent',
              borderRight: '3px solid transparent',
              borderTop: '6px solid #374151',
              marginTop: '-2px'
            }}
          />
        </div>
      </div>
    </div>
  )
}

