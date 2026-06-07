'use client'

interface CompanyPanelProps {
  name: string
  description: string
  docs: { name: string; status: 'new' | 'ready' | 'pending' }[]
  competitors: string[]
}

export default function CompanyPanel({ name, description, docs, competitors }: CompanyPanelProps) {
  return (
    <div className="surface-card p-5 h-full flex flex-col gap-6 overflow-y-auto">
      {/* Company header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-md bg-terminal-green/10 border border-terminal-green/30 flex items-center justify-center">
            <span className="font-mono text-terminal-green text-sm font-bold">
              {name.charAt(0).toUpperCase()}
            </span>
          </div>
          <h2 className="font-semibold text-gray-100 text-lg">{name}</h2>
        </div>
        <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
      </div>

      {/* Divider */}
      <div className="h-px bg-cmo-border" />

      {/* Documents */}
      <div>
        <h3 className="text-xs font-mono text-gray-500 uppercase tracking-wider mb-3">
          Documents
        </h3>
        <div className="space-y-1.5">
          {docs.map((doc) => (
            <div
              key={doc.name}
              className="flex items-center justify-between px-3 py-2 rounded-md hover:bg-white/5 transition-colors group cursor-pointer"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <svg
                  className="w-4 h-4 text-gray-600 flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <span className="text-sm text-gray-300 truncate group-hover:text-gray-100 transition-colors">
                  {doc.name}
                </span>
              </div>
              {doc.status === 'new' && (
                <span className="status-badge bg-terminal-green/10 text-terminal-green border border-terminal-green/30">
                  new
                </span>
              )}
              {doc.status === 'pending' && (
                <span className="status-badge bg-amber-500/10 text-amber-400 border border-amber-500/30">
                  pending
                </span>
              )}
              {doc.status === 'ready' && (
                <span className="status-badge bg-gray-700 text-gray-400">
                  ready
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-cmo-border" />

      {/* Competitors */}
      <div>
        <h3 className="text-xs font-mono text-gray-500 uppercase tracking-wider mb-3">
          Competitors
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {competitors.map((comp) => (
            <div
              key={comp}
              className="px-3 py-2 rounded-md bg-cmo-bg border border-cmo-border text-sm text-gray-400 hover:border-terminal-green/30 hover:text-gray-200 transition-colors cursor-pointer truncate"
            >
              {comp}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
