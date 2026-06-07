'use client'

import { useState } from 'react'

interface Project {
  id: string
  name: string
}

interface ProjectSwitcherProps {
  projects: Project[]
  current: string
  onChange: (id: string) => void
}

export default function ProjectSwitcher({ projects, current, onChange }: ProjectSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false)

  const currentProject = projects.find((p) => p.id === current)

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-4 py-2.5 surface-card hover:border-terminal-green/40 transition-colors w-full md:w-auto min-w-[240px]"
      >
        <div className="w-2 h-2 rounded-full bg-terminal-green animate-pulse-green" />
        <span className="font-mono text-sm text-terminal-green flex-1 text-left truncate">
          {currentProject?.name ?? 'Select project'}
        </span>
        <svg
          className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />

          {/* Dropdown */}
          <div className="absolute top-full left-0 mt-1 w-full min-w-[240px] z-20 surface-card shadow-xl shadow-black/40 py-1 max-h-60 overflow-y-auto">
            {projects.map((project) => (
              <button
                key={project.id}
                onClick={() => {
                  onChange(project.id)
                  setIsOpen(false)
                }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm font-mono transition-colors ${
                  project.id === current
                    ? 'bg-terminal-green/10 text-terminal-green'
                    : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    project.id === current ? 'bg-terminal-green' : 'bg-gray-600'
                  }`}
                />
                <span className="truncate">{project.name}</span>
                {project.id === current && (
                  <svg className="w-4 h-4 ml-auto text-terminal-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
