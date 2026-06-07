'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import type { ProjectConfig } from '@/config/projects'

// ---------- shared types returned by API routes ----------

export interface PageSpeedData {
  mobile: { performance: number; accessibility: number; bestPractices: number; seo: number }
  desktop: { performance: number; accessibility: number; bestPractices: number; seo: number }
  coreWebVitals: {
    fcp: { value: string; score: number }
    lcp: { value: string; score: number }
    tbt: { value: string; score: number }
    cls: { value: string; score: number }
    si: { value: string; score: number }
  }
  issues: { severity: 'high' | 'medium' | 'low'; title: string; description: string; category: string }[]
  fetchedAt: string
}

export interface SearchConsoleData {
  clicks: number
  impressions: number
  ctr: number
  position: number
  topQueries: { query: string; clicks: number; impressions: number; ctr: number; position: number }[]
  topPages: { page: string; clicks: number; impressions: number }[]
  daily: { date: string; clicks: number; impressions: number }[]
  fetchedAt: string
}

export interface ShopifyData {
  totalProducts: number
  activeProducts: number
  totalOrders: number
  recentOrders: number
  totalRevenue: number
  recentRevenue: number
  averageOrderValue: number
  topProducts: { title: string; totalSold: number; revenue: number; image?: string }[]
  fetchedAt: string
}

export interface GoogleAdsData {
  totalClicks: number
  totalImpressions: number
  totalCost: number
  averageCpc: number
  averageCtr: number
  conversions: number
  costPerConversion: number
  campaigns: { name: string; clicks: number; impressions: number; cost: number; conversions: number }[]
  daily: { date: string; clicks: number; impressions: number; cost: number }[]
  fetchedAt: string
}

export interface TechnicalData {
  ssl: { valid: boolean; issuer: string; expiresAt: string; daysLeft: number }
  dns: { records: { type: string; value: string }[] }
  uptime: { status: 'up' | 'down' | 'unknown'; responseTime: number }
  headers: { name: string; value: string; status: 'good' | 'warning' | 'missing' }[]
  fetchedAt: string
}

export interface ProjectData {
  pagespeed: PageSpeedData | null
  searchConsole: SearchConsoleData | null
  shopify: ShopifyData | null
  googleAds: GoogleAdsData | null
  technical: TechnicalData | null
}

// ---------- fetcher helper ----------

async function fetchJSON<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    return await res.json()
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

    setLoading(true)
    setError(null)

    try {
      // We always attempt pagespeed, search-console, and technical.
      // Shopify & Google Ads are conditional on the project config,
      // but we let the API route return 404 if not applicable.
      const baseQ = `?project=${projectId}`

      const results = await Promise.allSettled([
        fetchJSON<PageSpeedData>(`/api/pagespeed${baseQ}`),
        fetchJSON<SearchConsoleData>(`/api/search-console${baseQ}`),
        fetchJSON<ShopifyData>(`/api/shopify${baseQ}`),
        fetchJSON<GoogleAdsData>(`/api/google-ads${baseQ}`),
        fetchJSON<TechnicalData>(`/api/technical${baseQ}`),
      ])

      if (controller.signal.aborted) return

      const unwrap = <T,>(r: PromiseSettledResult<T | null>): T | null =>
        r.status === 'fulfilled' ? r.value : null

      setData({
        pagespeed: unwrap(results[0]),
        searchConsole: unwrap(results[1]),
        shopify: unwrap(results[2]),
        googleAds: unwrap(results[3]),
        technical: unwrap(results[4]),
      })
    } catch (e: any) {
      if (!controller.signal.aborted) {
        setError(e?.message ?? 'Failed to fetch project data')
      }
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false)
      }
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
