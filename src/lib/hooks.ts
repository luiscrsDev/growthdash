'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

// ---------- shared types returned by API routes ----------
// These mirror the actual JSON shapes returned by /api/* routes.

export interface LighthouseScores {
  performance: number
  accessibility: number
  bestPractices: number
  seo: number
}

export interface CoreWebVital {
  value: number
  unit: string
  rating: string
}

export interface PageSpeedData {
  mobile: LighthouseScores
  desktop: LighthouseScores
  coreWebVitals: {
    lcp: CoreWebVital
    fid: CoreWebVital
    cls: CoreWebVital
    fcp: CoreWebVital
    ttfb: CoreWebVital
  }
  issues: { severity: 'high' | 'medium' | 'low'; title: string; description: string; category: string }[]
  fetchedAt: string
}

export interface SearchConsoleDailyRow {
  date: string
  impressions: number
  clicks: number
  ctr: number
  position: number
}

export interface SearchConsoleData {
  domain: string
  days: number
  mock: boolean
  fetchedAt: string
  totals: {
    impressions: number
    clicks: number
    ctr: number
    avgPosition: number
  }
  daily: SearchConsoleDailyRow[]
}

export interface ShopifyData {
  store: string
  mock: boolean
  fetchedAt: string
  totalProducts: number
  totalOrders: number
  revenue: number
  currency: string
  topProducts: { title: string; totalSold: number; revenue: number }[]
}

export interface GoogleAdsData {
  cid: string
  days: number
  mock: boolean
  fetchedAt: string
  metrics: {
    impressions: number
    clicks: number
    conversions: number
    cost: number
    cpc: number
    ctr: number
    conversionRate: number
    costPerConversion: number
  }
  daily: { date: string; impressions: number; clicks: number; conversions: number; cost: number }[]
  topSearchTerms: { term: string; impressions: number; clicks: number; conversions: number; cost: number }[]
}

export interface SecurityHeader {
  name: string
  value: string | null
  present: boolean
  recommendation?: string
}

export interface TechnicalData {
  domain: string
  fetchedAt: string
  status: { code: number; text: string }
  https: { enabled: boolean; redirectsToHttps: boolean }
  server: string | null
  contentType: string | null
  poweredBy: string | null
  responseTimeMs: number
  securityHeaders: SecurityHeader[]
  summary: { score: number; issues: string[]; passed: string[] }
}

export interface ProjectData {
  pagespeed: PageSpeedData | null
  searchConsole: SearchConsoleData | null
  shopify: ShopifyData | null
  googleAds: GoogleAdsData | null
  technical: TechnicalData | null
}

// ---------- fetcher helper ----------

async function fetchJSON<T>(url: string, signal?: AbortSignal): Promise<T | null> {
  try {
    const res = await fetch(url, { signal })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

// ---------- pagespeed helper: fetch both strategies and merge ----------

const DEFAULT_SCORES: LighthouseScores = { performance: 0, accessibility: 0, bestPractices: 0, seo: 0 }
const DEFAULT_VITAL: CoreWebVital = { value: 0, unit: '', rating: 'unknown' }

async function fetchPageSpeed(projectId: string, signal?: AbortSignal): Promise<PageSpeedData | null> {
  try {
    const baseQ = `?project=${projectId}`
    const [mobileRes, desktopRes] = await Promise.all([
      fetchJSON<any>(`/api/pagespeed${baseQ}&strategy=mobile`, signal),
      fetchJSON<any>(`/api/pagespeed${baseQ}&strategy=desktop`, signal),
    ])

    if (!mobileRes && !desktopRes) return null

    return {
      mobile: mobileRes?.scores ?? DEFAULT_SCORES,
      desktop: desktopRes?.scores ?? DEFAULT_SCORES,
      coreWebVitals: (mobileRes ?? desktopRes)?.coreWebVitals ?? {
        lcp: DEFAULT_VITAL,
        fid: DEFAULT_VITAL,
        cls: DEFAULT_VITAL,
        fcp: DEFAULT_VITAL,
        ttfb: DEFAULT_VITAL,
      },
      issues:
        (mobileRes ?? desktopRes)?.topIssues?.map((i: any) => ({
          title: i.title,
          description: i.description ?? '',
          severity:
            i.score !== null && i.score < 0.5
              ? ('high' as const)
              : i.score !== null && i.score < 0.7
                ? ('medium' as const)
                : ('low' as const),
          category: 'Performance',
        })) ?? [],
      fetchedAt: new Date().toISOString(),
    }
  } catch {
    return null
  }
}

// ---------- useProjectData ----------

export function useProjectData(projectId: string) {
  const [data, setData] = useState<ProjectData>({
    pagespeed: null,
    searchConsole: null,
    shopify: null,
    googleAds: null,
    technical: null,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const fetchData = useCallback(async () => {
    // Cancel any in-flight requests for the previous project
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    const { signal } = controller

    setLoading(true)
    setError(null)
    setData({ pagespeed: null, searchConsole: null, shopify: null, googleAds: null, technical: null })

    const baseQ = `?project=${projectId}`

    // Progressive loading: each dataset is rendered as soon as it arrives.
    // PageSpeed (Google PSI) can take 30-60s, so it must NOT block the page.
    const apply = <K extends keyof ProjectData>(key: K, value: ProjectData[K]) => {
      if (signal.aborted) return
      setData((prev) => ({ ...prev, [key]: value }))
    }

    const fast = [
      fetchJSON<SearchConsoleData>(`/api/search-console${baseQ}`, signal).then((v) => apply('searchConsole', v)),
      fetchJSON<ShopifyData>(`/api/shopify${baseQ}`, signal).then((v) => apply('shopify', v)),
      fetchJSON<GoogleAdsData>(`/api/google-ads${baseQ}`, signal).then((v) => apply('googleAds', v)),
      fetchJSON<TechnicalData>(`/api/technical${baseQ}`, signal).then((v) => apply('technical', v)),
    ]

    // Slow: fills in whenever it lands — UI updates reactively.
    fetchPageSpeed(projectId, signal).then((v) => apply('pagespeed', v))

    await Promise.allSettled(fast)
    if (!signal.aborted) {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    fetchData()
    return () => {
      abortRef.current?.abort()
    }
  }, [fetchData])

  return { data, loading, error, refetch: fetchData }
}
