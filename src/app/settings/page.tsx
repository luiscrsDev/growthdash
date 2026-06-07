'use client'

import { useState, useEffect, useCallback } from 'react'
import { projects } from '@/config/projects'
import Link from 'next/link'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface IntegrationField {
  key: string
  label: string
  placeholder: string
  type: 'text' | 'password' | 'textarea'
  help?: string
}

interface IntegrationConfig {
  id: string
  name: string
  icon: string
  fields: IntegrationField[]
}

// ---------------------------------------------------------------------------
// Integration definitions
// ---------------------------------------------------------------------------

const integrations: IntegrationConfig[] = [
  {
    id: 'pagespeed',
    name: 'Google PageSpeed',
    icon: '⚡',
    fields: [
      {
        key: 'pagespeedApiKey',
        label: 'API Key',
        placeholder: 'AIzaSy...',
        type: 'password',
        help: 'Get from Google Cloud Console → APIs → PageSpeed Insights API → Credentials',
      },
    ],
  },
  {
    id: 'searchConsole',
    name: 'Google Search Console',
    icon: '🔍',
    fields: [
      {
        key: 'serviceAccountJson',
        label: 'Service Account JSON',
        placeholder: '{"type":"service_account","project_id":...}',
        type: 'textarea',
        help: 'Create a Service Account in Google Cloud, download the JSON key file, and paste its contents here',
      },
    ],
  },
  {
    id: 'shopify',
    name: 'Shopify',
    icon: '🛍️',
    fields: [
      {
        key: 'shopifyDomain',
        label: 'Store Domain',
        placeholder: 'your-store.myshopify.com',
        type: 'text',
        help: 'Your Shopify store domain (e.g., filahive.myshopify.com)',
      },
      {
        key: 'shopifyToken',
        label: 'Admin API Access Token',
        placeholder: 'shpat_...',
        type: 'password',
        help: 'Settings → Apps → Develop apps → Create app → Admin API access token',
      },
    ],
  },
  {
    id: 'googleAds',
    name: 'Google Ads',
    icon: '📊',
    fields: [
      {
        key: 'googleAdsCid',
        label: 'Customer ID (CID)',
        placeholder: '123-456-7890',
        type: 'text',
        help: 'Your Google Ads account CID (found in the top-right of Google Ads)',
      },
    ],
  },
]

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function SettingsPage() {
  const [currentProject, setCurrentProject] = useState('__global__')
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [configuredStatus, setConfiguredStatus] = useState<Record<string, boolean>>({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)
  const [hasKV, setHasKV] = useState(false)

  const isGlobal = currentProject === '__global__'
  const project = projects.find((p) => p.id === currentProject)

  // Load current settings
  const loadSettings = useCallback(async () => {
    setLoading(true)
    try {
      if (isGlobal) {
        const res = await fetch('/api/settings')
        const data = await res.json()
        setHasKV(data.hasKV ?? false)
        // For global view, we don't load form data — just status
        setConfiguredStatus({})
        setFormData({})
      } else {
        const res = await fetch(`/api/settings?project=${currentProject}`)
        const data = await res.json()
        setConfiguredStatus(data.configured ?? {})
        // Don't pre-fill passwords for security
        setFormData({})
      }
    } catch {
      // silent
    }
    setLoading(false)
  }, [currentProject, isGlobal])

  useEffect(() => {
    loadSettings()
  }, [loadSettings])

  // Save
  const handleSave = async () => {
    setSaving(true)
    setSaved(false)

    // Remove empty values
    const filtered: Record<string, string> = {}
    for (const [k, v] of Object.entries(formData)) {
      if (v.trim()) filtered[k] = v.trim()
    }

    try {
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project: isGlobal ? undefined : currentProject,
          credentials: filtered,
        }),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
      await loadSettings()
    } catch {
      // silent
    }
    setSaving(false)
  }

  // Which integrations to show
  const visibleIntegrations = isGlobal
    ? integrations
    : integrations.filter((i) => project?.integrations[i.id as keyof typeof project.integrations])

  return (
    <div className="min-h-screen bg-cmo-bg text-cmo-text">
      {/* Header */}
      <div className="border-b border-cmo-border px-6 py-4">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-2 text-sm text-cmo-muted hover:text-terminal-green transition-colors font-mono"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Dashboard
            </Link>
            <div className="h-4 w-px bg-cmo-border" />
            <h1 className="text-lg font-semibold font-mono">
              <span className="text-terminal-green">$</span> settings
            </h1>
          </div>

          {/* KV status */}
          <div className="flex items-center gap-2 text-xs font-mono text-cmo-muted">
            <span
              className={`w-1.5 h-1.5 rounded-full ${hasKV ? 'bg-terminal-green' : 'bg-amber-400'}`}
            />
            {hasKV ? 'Vercel KV connected' : 'In-memory (dev mode)'}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Scope selector */}
        <div className="mb-8">
          <label className="text-xs font-mono text-cmo-muted uppercase tracking-wider mb-3 block">
            Configure credentials for
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setCurrentProject('__global__')}
              className={`px-4 py-2 rounded-lg text-sm font-mono transition-all ${
                isGlobal
                  ? 'bg-terminal-green/10 text-terminal-green border border-terminal-green/30'
                  : 'bg-cmo-surface text-cmo-muted border border-cmo-border hover:border-cmo-muted'
              }`}
            >
              Global (all projects)
            </button>
            {projects.map((p) => (
              <button
                key={p.id}
                onClick={() => setCurrentProject(p.id)}
                className={`px-4 py-2 rounded-lg text-sm font-mono transition-all ${
                  currentProject === p.id
                    ? 'bg-terminal-green/10 text-terminal-green border border-terminal-green/30'
                    : 'bg-cmo-surface text-cmo-muted border border-cmo-border hover:border-cmo-muted'
                }`}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>

        {/* Info box */}
        {isGlobal && (
          <div className="mb-8 p-4 rounded-lg border border-cmo-border bg-cmo-surface">
            <p className="text-sm text-cmo-muted leading-relaxed">
              <span className="text-terminal-green font-mono">Global credentials</span> apply to all
              projects. You can override them per-project by selecting a specific project above.
              Priority: Project-specific → Global → Environment variables.
            </p>
          </div>
        )}

        {!isGlobal && (
          <div className="mb-8 p-4 rounded-lg border border-cmo-border bg-cmo-surface">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-md bg-terminal-green/10 border border-terminal-green/30 flex items-center justify-center">
                <span className="font-mono text-terminal-green text-sm font-bold">
                  {project?.name.charAt(0)}
                </span>
              </div>
              <div>
                <div className="text-sm font-medium">{project?.name}</div>
                <div className="text-xs text-cmo-muted">{project?.domain}</div>
              </div>
            </div>
            <p className="text-sm text-cmo-muted mt-2">
              Only integrations enabled for this project are shown below.
            </p>
          </div>
        )}

        {loading ? (
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse rounded-lg bg-cmo-surface h-32" />
            ))}
          </div>
        ) : (
          <>
            {/* Integration cards */}
            <div className="space-y-6">
              {visibleIntegrations.map((integration) => {
                const isConfigured = configuredStatus[integration.id]

                return (
                  <div
                    key={integration.id}
                    className="rounded-lg border border-cmo-border bg-cmo-surface overflow-hidden"
                  >
                    {/* Card header */}
                    <div className="flex items-center justify-between px-5 py-4 border-b border-cmo-border">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{integration.icon}</span>
                        <span className="font-medium text-sm">{integration.name}</span>
                      </div>
                      {!isGlobal && (
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-mono ${
                            isConfigured
                              ? 'bg-terminal-green/10 text-terminal-green border border-terminal-green/30'
                              : 'bg-red-500/10 text-red-400 border border-red-500/30'
                          }`}
                        >
                          {isConfigured ? 'configured' : 'not configured'}
                        </span>
                      )}
                    </div>

                    {/* Fields */}
                    <div className="px-5 py-4 space-y-4">
                      {integration.fields.map((field) => (
                        <div key={field.key}>
                          <label className="text-xs font-mono text-cmo-muted mb-1.5 block">
                            {field.label}
                          </label>
                          {field.type === 'textarea' ? (
                            <textarea
                              value={formData[field.key] ?? ''}
                              onChange={(e) =>
                                setFormData((prev) => ({ ...prev, [field.key]: e.target.value }))
                              }
                              placeholder={field.placeholder}
                              rows={3}
                              className="w-full px-3 py-2 rounded-md bg-cmo-bg border border-cmo-border text-sm font-mono text-cmo-text placeholder-gray-600 focus:border-terminal-green/50 focus:outline-none focus:ring-1 focus:ring-terminal-green/20 transition-colors resize-none"
                            />
                          ) : (
                            <input
                              type={field.type}
                              value={formData[field.key] ?? ''}
                              onChange={(e) =>
                                setFormData((prev) => ({ ...prev, [field.key]: e.target.value }))
                              }
                              placeholder={field.placeholder}
                              className="w-full px-3 py-2 rounded-md bg-cmo-bg border border-cmo-border text-sm font-mono text-cmo-text placeholder-gray-600 focus:border-terminal-green/50 focus:outline-none focus:ring-1 focus:ring-terminal-green/20 transition-colors"
                            />
                          )}
                          {field.help && (
                            <p className="text-xs text-gray-600 mt-1.5 leading-relaxed">
                              {field.help}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Save button */}
            <div className="mt-8 flex items-center gap-4">
              <button
                onClick={handleSave}
                disabled={saving || Object.keys(formData).length === 0}
                className={`px-6 py-2.5 rounded-lg font-mono text-sm transition-all ${
                  saving || Object.keys(formData).length === 0
                    ? 'bg-cmo-border text-cmo-muted cursor-not-allowed'
                    : 'bg-terminal-green/10 text-terminal-green border border-terminal-green/30 hover:bg-terminal-green/20'
                }`}
              >
                {saving ? (
                  <span className="flex items-center gap-2">
                    <span className="w-3 h-3 border-2 border-terminal-green/30 border-t-terminal-green rounded-full animate-spin" />
                    Saving...
                  </span>
                ) : (
                  '$ save --credentials'
                )}
              </button>

              {saved && (
                <span className="text-sm text-terminal-green font-mono animate-fade-in">
                  Saved successfully
                </span>
              )}
            </div>

            {/* Env vars reminder */}
            <div className="mt-12 p-4 rounded-lg border border-cmo-border bg-cmo-bg">
              <h3 className="text-xs font-mono text-cmo-muted uppercase tracking-wider mb-3">
                Alternative: Environment Variables
              </h3>
              <p className="text-sm text-gray-500 mb-3">
                You can also set credentials as env vars in Vercel or <code className="text-terminal-green/60">.env.local</code>:
              </p>
              <pre className="text-xs font-mono text-gray-600 bg-black/30 rounded-md p-3 overflow-x-auto">
{`GOOGLE_PAGESPEED_API_KEY=your-key
GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
FILAHIVE_SHOPIFY_DOMAIN=filahive.myshopify.com
FILAHIVE_SHOPIFY_TOKEN=shpat_xxx
APLUS_GOOGLE_ADS_CID=106-780-6098`}
              </pre>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
