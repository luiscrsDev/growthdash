'use client'

interface TerminalHeaderProps {
  domain: string
  status: string
}

export default function TerminalHeader({ domain, status }: TerminalHeaderProps) {
  const isCompleted = status.toUpperCase() === 'COMPLETED'

  return (
    <div className="surface-card px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Left: Robot icon + domain info */}
        <div className="flex items-center gap-4">
          {/* Pixel-art robot icon */}
          <div className="relative w-10 h-10 flex-shrink-0">
            <div className="absolute inset-0 border-2 border-terminal-green rounded-md bg-terminal-green/10" />
            {/* Eyes */}
            <div className="absolute top-2.5 left-2 w-1.5 h-1.5 bg-terminal-green rounded-sm" />
            <div className="absolute top-2.5 right-2 w-1.5 h-1.5 bg-terminal-green rounded-sm" />
            {/* Mouth */}
            <div className="absolute bottom-2 left-2.5 w-5 h-1 bg-terminal-green/60 rounded-sm" />
            {/* Antenna */}
            <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-0.5 h-2 bg-terminal-green" />
            <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-2 h-2 bg-terminal-green rounded-full animate-pulse-green" />
          </div>

          <div className="font-mono">
            <div className="flex items-center gap-2">
              <span className="text-gray-500 text-sm">target://</span>
              <span className="text-terminal-green text-lg font-semibold glow-green">
                {domain}
              </span>
            </div>
            <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
              <span className="flex items-center gap-1.5">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isCompleted ? 'bg-terminal-green animate-pulse-green' : 'bg-amber-400'
                  }`}
                />
                <span className={isCompleted ? 'text-terminal-green' : 'text-amber-400'}>
                  {status.toUpperCase()}
                </span>
              </span>
              <span className="text-cmo-border">|</span>
              <span>PLAN: PRO</span>
              <span className="text-cmo-border">|</span>
              <span>ROLE: AI CMO</span>
            </div>
          </div>
        </div>

        {/* Right: Terminal prompt */}
        <div className="hidden md:flex items-center gap-2 font-mono text-xs text-gray-600">
          <span className="text-terminal-green">$</span>
          <span className="animate-scan">growthdash --analyze --full</span>
          <span className="w-2 h-4 bg-terminal-green/60 animate-pulse" />
        </div>
      </div>
    </div>
  )
}
