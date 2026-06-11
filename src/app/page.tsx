'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { projects, getProject } from '@/config/projects'
import { useProjectData } from '@/lib/hooks'
import TerminalHeader from '@/components/TerminalHeader'
import ProjectSwitcher from '@/components/ProjectSwitcher'
import CompanyPanel from '@/components/CompanyPanel'
import AnalyticsPanel from '@/components/AnalyticsPanel'
import AgentsPanel from '@/components/AgentsPanel'

// ---------- skeleton ----------

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-cmo-border ${className}`} />
}

function PanelSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3 p-4">
      <Skeleton className="h-4 w-2/3" />
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-3 w-full" />
      ))}
    </div>
  )
}

// ---------- agent recommendations (static for now, will come from AI later) ----------

const agentRecommendations: Record<string, Record<string, { severity: 'high' | 'medium' | 'low'; text: string }[]>> = {
  filahive: {
    reddit: [
      { severity: 'medium', text: 'Post in r/3Dprinting about fidget spinner designs — 312 upvotes on similar thread' },
      { severity: 'medium', text: 'Reply to r/DnD thread asking for tabletop accessories — high purchase intent' },
    ],
    seo: [
      { severity: 'high', text: 'Render-blocking resources detected — defer non-critical CSS/JS' },
      { severity: 'medium', text: 'Low content-to-code ratio — add more product descriptions' },
    ],
    x: [
      { severity: 'medium', text: 'Tweet about new fidget spinner collection with video demo' },
      { severity: 'medium', text: 'Share customer review thread — social proof converts' },
    ],
    articles: [
      { severity: 'medium', text: '"Top 10 3D Printed Gifts Under $25" — high search volume keyword' },
    ],
    linkedin: [
      { severity: 'medium', text: 'Behind-the-scenes post about 3D printing process — builds brand trust' },
    ],
  },
  aplus: {
    seo: [
      { severity: 'high', text: 'Missing meta descriptions on 4 service pages' },
      { severity: 'high', text: 'No structured data (LocalBusiness schema) — add for Google Maps visibility' },
      { severity: 'medium', text: 'Image alt tags missing on gallery page' },
    ],
    'google-ads': [
      { severity: 'medium', text: 'Review search terms for junk queries — last checked 5 days ago' },
      { severity: 'medium', text: 'CPC trending up +12% — consider negative keywords' },
    ],
    reddit: [
      { severity: 'medium', text: 'Reply to r/homeimprovement thread about property maintenance services' },
    ],
  },
  gbs: {
    seo: [
      { severity: 'high', text: 'Landing pages missing H1 tags — critical for search ranking' },
      { severity: 'high', text: 'No sitemap.xml found — submit to Google Search Console' },
      { severity: 'medium', text: 'Slow LCP on mobile (4.2s) — optimize hero images' },
      { severity: 'medium', text: 'Duplicate title tags across product LPs' },
    ],
    instagram: [
      { severity: 'medium', text: 'Reel: Bambu Lab P1S unboxing + first print timelapse' },
      { severity: 'medium', text: 'Reel: Before/after — print quality comparison across printers' },
    ],
    articles: [
      { severity: 'medium', text: '"Bambu Lab P1S vs Creality K1: qual comprar em 2026?" — high search volume BR' },
      { severity: 'medium', text: '"Guia completo: como escolher sua primeira impressora 3D" — funnel top' },
    ],
  },
}

// ---------- document lists per project ----------

const projectDocs: Record<string, { name: string; status: 'new' | 'ready' | 'pending' }[]> = {
  filahive: [
    { name: 'Product information', status: 'new' },
    { name: 'Competitor analysis', status: 'new' },
    { name: 'Brand voice', status: 'new' },
    { name: 'Marketing strategy', status: 'ready' },
    { name: 'Articles', status: 'pending' },
  ],
  aplus: [
    { name: 'Service catalog', status: 'new' },
    { name: 'Competitor analysis', status: 'new' },
    { name: 'Brand voice', status: 'pending' },
    { name: 'Google Ads strategy', status: 'ready' },
  ],
  gbs: [
    { name: 'Product catalog', status: 'new' },
    { name: 'Competitor analysis', status: 'pending' },
    { name: 'Brand positioning', status: 'new' },
    { name: 'LP performance', status: 'pending' },
  ],
}

// ---------- main page ----------

export default function DashboardPage() {
  const [currentProject, setCurrentProject] = useState('filahive')
  const project = getProject(currentProject)
  const { data, loading, error, refetch } = useProjectData(currentProject)

  const [time, setTime] = useState('')
  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString('en-US', { hour12: false }))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  if (!project) {
    return (
      <div className="flex h-screen items-center justify-center bg-cmo-bg font-mono text-cmo-muted">
        Project not found.
      </div>
    )
  }

  // Map API data to component props

  // Real delta: compare second half of the period vs first half
  const halfDelta = (rows: { [k: string]: any }[] | undefined, key: string): number | undefined => {
    if (!rows || rows.length < 4) return undefined
    const mid = Math.floor(rows.length / 2)
    const first = rows.slice(0, mid).reduce((s, r) => s + (r[key] ?? 0), 0)
    const second = rows.slice(mid).reduce((s, r) => s + (r[key] ?? 0), 0)
    if (first === 0) return undefined
    return Number((((second - first) / first) * 100).toFixed(1))
  }

  const trafficProps = {
    stats: data.searchConsole
      ? [
          { label: 'Impressions', value: data.searchConsole.totals.impressions.toLocaleString(), delta: halfDelta(data.searchConsole.daily, 'impressions') },
          { label: 'Clicks', value: data.searchConsole.totals.clicks.toLocaleString(), delta: halfDelta(data.searchConsole.daily, 'clicks') },
          { label: 'Avg Position', value: Math.round(data.searchConsole.totals.avgPosition).toString() },
        ]
      : [
          { label: 'Impressions', value: '—' },
          { label: 'Clicks', value: '—' },
          { label: 'Avg Position', value: '—' },
        ],
    chartData: data.searchConsole?.daily?.map((d) => d.clicks) ?? [0, 0, 0, 0, 0, 0, 0],
    chartLabels: data.searchConsole?.daily?.map((d) => {
      const date = new Date(d.date)
      return date.toLocaleDateString('en-US', { weekday: 'short' })
    }) ?? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  }

  const seoProps = {
    pending: !data.pagespeed,
    mobile: data.pagespeed?.mobile ?? { performance: 0, accessibility: 0, bestPractices: 0, seo: 0 },
    desktop: data.pagespeed?.desktop ?? { performance: 0, accessibility: 0, bestPractices: 0, seo: 0 },
  }

  const technicalProps = {
    onPageScore: data.pagespeed
      ? Math.round(
          ((data.pagespeed.mobile?.seo ?? 0) + (data.pagespeed.desktop?.seo ?? 0) +
            (data.pagespeed.mobile?.accessibility ?? 0) + (data.pagespeed.desktop?.accessibility ?? 0)) / 4
        )
      : 0,
    details: [
      { label: 'Server', value: data.technical?.server ?? 'Unknown' },
      { label: 'Status', value: data.technical ? `${data.technical.status.code} ${data.technical.status.text}`.trim() : 'Unknown' },
      { label: 'Response Time', value: data.technical ? `${data.technical.responseTimeMs}ms` : '—' },
      { label: 'HTTPS', value: data.technical ? (data.technical.https.enabled ? 'Valid' : 'Not enabled') : '—' },
      { label: 'Security Score', value: data.technical ? `${data.technical.summary.score}/100` : '—' },
      { label: 'Platform', value: project.id === 'filahive' ? 'Shopify' : 'Next.js / Vercel' },
    ],
  }

  // Build agents with recommendations
  const agentsWithRecs = project.agents
    .filter((a) => a.enabled)
    .map((agent) => ({
      name: agent.name,
      icon: agent.id.charAt(0).toUpperCase(),
      color: agent.color,
      status: `${(agentRecommendations[project.id]?.[agent.id] ?? []).length} items ready`,
      recommendations: agentRecommendations[project.id]?.[agent.id] ?? [],
    }))

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-cmo-bg text-cmo-text">
      {/* top bar */}
      <div className="flex items-center justify-between border-b border-cmo-border px-4 py-2">
        <TerminalHeader domain={project.domain} status="COMPLETED" />
        <div className="flex items-center gap-3">
          <ProjectSwitcher
            projects={projects.map((p) => ({ id: p.id, name: p.name }))}
            current={currentProject}
            onChange={setCurrentProject}
          />
          <Link
            href="/settings"
            className="p-2 rounded-md text-cmo-muted hover:text-terminal-green hover:bg-terminal-green/10 transition-colors"
            title="Settings"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </Link>
        </div>
      </div>

      {/* 3-column layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* left: company */}
        <aside className="w-[220px] shrink-0 overflow-y-auto border-r border-cmo-border">
          {loading ? (
            <PanelSkeleton rows={6} />
          ) : (
            <CompanyPanel
              name={project.name}
              description={project.description}
              docs={projectDocs[project.id] ?? []}
              competitors={project.competitors}
            />
          )}
        </aside>

        {/* center: analytics */}
        <main className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="space-y-4 p-6">
              <div className="grid grid-cols-3 gap-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 rounded-lg" />
                ))}
              </div>
              <Skeleton className="h-48 rounded-lg" />
            </div>
          ) : error ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-cmo-muted">
              <span className="text-red-400">Error loading data</span>
              <p className="text-xs">{error}</p>
              <button
                onClick={refetch}
                className="rounded border border-cmo-border px-3 py-1 text-xs text-terminal-green hover:bg-cmo-surface transition"
              >
                Retry
              </button>
            </div>
          ) : (
            <AnalyticsPanel
              traffic={trafficProps}
              seo={seoProps}
              technical={technicalProps}
            />
          )}
        </main>

        {/* right: agents */}
        <aside className="w-[280px] shrink-0 overflow-y-auto border-l border-cmo-border">
          {loading ? (
            <PanelSkeleton rows={5} />
          ) : (
            <AgentsPanel agents={agentsWithRecs} />
          )}
        </aside>
      </div>

      {/* status bar */}
      <div className="flex items-center justify-between border-t border-cmo-border px-4 py-1 text-[10px] text-cmo-muted font-mono">
        <span>GrowthDash v1.0 — {project.domain}</span>
        <span className="flex items-center gap-2">
          {loading && <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-yellow-400" />}
          {!loading && !error && <span className="inline-block h-1.5 w-1.5 rounded-full bg-terminal-green" />}
          {!loading && error && <span className="inline-block h-1.5 w-1.5 rounded-full bg-red-400" />}
          <span>
            {loading ? 'Fetching data...' : error ? 'Connection error' : `Synced ${time}`}
          </span>
        </span>
      </div>
    </div>
  )
}
