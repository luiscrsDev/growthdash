'use client'

import { useState } from 'react'

interface Recommendation {
  severity: 'high' | 'medium' | 'low'
  text: string
}

interface Agent {
  name: string
  icon: string
  color: string
  status: string
  recommendations: Recommendation[]
}

interface AgentsPanelProps {
  agents: Agent[]
}

export default function AgentsPanel({ agents }: AgentsPanelProps) {
  const [expanded, setExpanded] = useState<string | null>(null)

  const toggle = (name: string) => {
    setExpanded(expanded === name ? null : name)
  }

  return (
    <div className="surface-card p-5 h-full flex flex-col overflow-y-auto">
      <h3 className="text-xs font-mono text-gray-500 uppercase tracking-wider mb-4">
        AI Agents
      </h3>

      <div className="space-y-2">
        {agents.map((agent) => {
          const isExpanded = expanded === agent.name
          const highCount = agent.recommendations.filter((r) => r.severity === 'high').length
          const medCount = agent.recommendations.filter((r) => r.severity === 'medium').length

          return (
            <div
              key={agent.name}
              className="bg-cmo-bg border border-cmo-border rounded-lg overflow-hidden transition-all duration-200"
            >
              {/* Agent header */}
              <button
                onClick={() => toggle(agent.name)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors"
              >
                {/* Icon circle */}
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0"
                  style={{ backgroundColor: `${agent.color}20`, color: agent.color }}
                >
                  {agent.icon}
                </div>

                <div className="flex-1 text-left min-w-0">
                  <div className="text-sm font-medium text-gray-200 truncate">{agent.name}</div>
                  <div className="text-xs text-gray-500">{agent.status}</div>
                </div>

                {/* Severity counts */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {highCount > 0 && (
                    <span className="status-badge bg-red-500/10 text-red-400 border border-red-500/30">
                      {highCount}
                    </span>
                  )}
                  {medCount > 0 && (
                    <span className="status-badge bg-amber-500/10 text-amber-400 border border-amber-500/30">
                      {medCount}
                    </span>
                  )}
                </div>

                {/* Chevron */}
                <svg
                  className={`w-4 h-4 text-gray-600 transition-transform duration-200 flex-shrink-0 ${
                    isExpanded ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {/* Recommendations (expanded) */}
              {isExpanded && agent.recommendations.length > 0 && (
                <div className="border-t border-cmo-border px-4 py-3 space-y-2">
                  {agent.recommendations.map((rec, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-3 py-2 px-3 rounded-md bg-cmo-surface"
                    >
                      {/* Severity badge */}
                      <span
                        className={`status-badge flex-shrink-0 mt-0.5 ${
                          rec.severity === 'high'
                            ? 'bg-red-500/10 text-red-400 border border-red-500/30'
                            : rec.severity === 'medium'
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                              : 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                        }`}
                      >
                        {rec.severity}
                      </span>

                      {/* Text */}
                      <span className="flex-1 text-sm text-gray-300 leading-snug">{rec.text}</span>

                      {/* Fix button */}
                      <button className="flex-shrink-0 px-3 py-1 text-xs font-mono rounded-md bg-terminal-green/10 text-terminal-green border border-terminal-green/30 hover:bg-terminal-green/20 transition-colors">
                        Fix
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
