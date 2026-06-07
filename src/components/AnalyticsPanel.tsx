'use client'

import { useState } from 'react'
import ScoreRing from './ScoreRing'
import TrafficChart from './TrafficChart'

interface StatCard {
  label: string
  value: string | number
  delta?: number
}

interface ScoreSet {
  performance: number
  accessibility: number
  bestPractices: number
  seo: number
}

interface TechnicalDetail {
  label: string
  value: string
}

interface AnalyticsPanelProps {
  traffic: {
    stats: StatCard[]
    chartData: number[]
    chartLabels: string[]
  }
  seo: {
    mobile: ScoreSet
    desktop: ScoreSet
  }
  technical: {
    onPageScore: number
    details: TechnicalDetail[]
  }
}

type Tab = 'traffic' | 'seo' | 'technical'

export default function AnalyticsPanel({ traffic, seo, technical }: AnalyticsPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>('traffic')

  const tabs: { id: Tab; label: string }[] = [
    { id: 'traffic', label: 'Traffic' },
    { id: 'seo', label: 'SEO' },
    { id: 'technical', label: 'Technical' },
  ]

  return (
    <div className="surface-card p-5 h-full flex flex-col">
      {/* Tab bar */}
      <div className="flex items-center gap-2 mb-5">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`tab-button ${
              activeTab === tab.id ? 'tab-button-active' : 'tab-button-inactive'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'traffic' && <TrafficTab {...traffic} />}
        {activeTab === 'seo' && <SEOTab {...seo} />}
        {activeTab === 'technical' && <TechnicalTab {...technical} />}
      </div>
    </div>
  )
}

/* --- Traffic Tab --- */
function TrafficTab({
  stats,
  chartData,
  chartLabels,
}: {
  stats: StatCard[]
  chartData: number[]
  chartLabels: string[]
}) {
  return (
    <div className="space-y-5">
      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-3">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-cmo-bg border border-cmo-border rounded-lg p-4">
            <div className="text-xs font-mono text-gray-500 uppercase tracking-wider mb-1">
              {stat.label}
            </div>
            <div className="flex items-end gap-2">
              <span className="text-xl font-semibold text-gray-100">{stat.value}</span>
              {stat.delta !== undefined && (
                <span
                  className={`text-xs font-mono mb-0.5 ${
                    stat.delta >= 0 ? 'text-terminal-green' : 'text-red-400'
                  }`}
                >
                  {stat.delta >= 0 ? '+' : ''}
                  {stat.delta}%
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="bg-cmo-bg border border-cmo-border rounded-lg p-4 h-[280px]">
        <TrafficChart data={chartData} labels={chartLabels} />
      </div>
    </div>
  )
}

/* --- SEO Tab --- */
function SEOTab({ mobile, desktop }: { mobile: ScoreSet; desktop: ScoreSet }) {
  return (
    <div className="space-y-6">
      {/* Mobile scores */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          <h3 className="text-xs font-mono text-gray-500 uppercase tracking-wider">
            Mobile Scores
          </h3>
        </div>
        <div className="grid grid-cols-4 gap-4">
          <ScoreRing score={mobile.performance} label="Performance" size="sm" />
          <ScoreRing score={mobile.accessibility} label="Accessibility" size="sm" />
          <ScoreRing score={mobile.bestPractices} label="Best Practices" size="sm" />
          <ScoreRing score={mobile.seo} label="SEO" size="sm" />
        </div>
      </div>

      {/* Desktop scores */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <h3 className="text-xs font-mono text-gray-500 uppercase tracking-wider">
            Desktop Scores
          </h3>
        </div>
        <div className="grid grid-cols-4 gap-4">
          <ScoreRing score={desktop.performance} label="Performance" size="sm" />
          <ScoreRing score={desktop.accessibility} label="Accessibility" size="sm" />
          <ScoreRing score={desktop.bestPractices} label="Best Practices" size="sm" />
          <ScoreRing score={desktop.seo} label="SEO" size="sm" />
        </div>
      </div>
    </div>
  )
}

/* --- Technical Tab --- */
function TechnicalTab({
  onPageScore,
  details,
}: {
  onPageScore: number
  details: TechnicalDetail[]
}) {
  return (
    <div className="space-y-6">
      {/* On-page score */}
      <div className="flex justify-center py-2">
        <ScoreRing score={onPageScore} label="On-Page Score" size="md" />
      </div>

      {/* Detail rows */}
      <div className="space-y-1">
        {details.map((detail) => (
          <div
            key={detail.label}
            className="flex items-center justify-between px-3 py-2.5 rounded-md hover:bg-white/5 transition-colors"
          >
            <span className="text-sm text-gray-500">{detail.label}</span>
            <span className="text-sm font-mono text-gray-200">{detail.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
