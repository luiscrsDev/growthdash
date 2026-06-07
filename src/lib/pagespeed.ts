export interface LighthouseScores {
  performance: number
  accessibility: number
  bestPractices: number
  seo: number
}

export interface CoreWebVitals {
  fcp: { value: string; score: number }
  lcp: { value: string; score: number }
  tbt: { value: string; score: number }
  cls: { value: string; score: number }
  si: { value: string; score: number }
}

export interface SEOIssue {
  severity: 'high' | 'medium' | 'low'
  title: string
  description: string
  category: string
}

export interface PageSpeedResult {
  mobile: LighthouseScores
  desktop: LighthouseScores
  coreWebVitals: CoreWebVitals
  issues: SEOIssue[]
  fetchedAt: string
}

const API_KEY = process.env.GOOGLE_PAGESPEED_API_KEY || ''

async function fetchLighthouse(
  url: string,
  strategy: 'mobile' | 'desktop'
): Promise<{ scores: LighthouseScores; vitals?: CoreWebVitals; issues: SEOIssue[] }> {
  const categories = ['performance', 'accessibility', 'best-practices', 'seo']
  const params = new URLSearchParams({
    url: `https://${url}`,
    strategy,
    ...Object.fromEntries(categories.map((c, i) => [`category`, c])),
  })

  // Build URL with multiple category params
  const baseUrl = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed'
  const categoryParams = categories.map((c) => `category=${c}`).join('&')
  const apiUrl = `${baseUrl}?url=https://${url}&strategy=${strategy}&${categoryParams}${API_KEY ? `&key=${API_KEY}` : ''}`

  const res = await fetch(apiUrl, { next: { revalidate: 3600 } })

  if (!res.ok) {
    throw new Error(`PageSpeed API error: ${res.status}`)
  }

  const data = await res.json()
  const cats = data.lighthouseResult?.categories || {}
  const audits = data.lighthouseResult?.audits || {}

  const scores: LighthouseScores = {
    performance: Math.round((cats.performance?.score || 0) * 100),
    accessibility: Math.round((cats.accessibility?.score || 0) * 100),
    bestPractices: Math.round((cats['best-practices']?.score || 0) * 100),
    seo: Math.round((cats.seo?.score || 0) * 100),
  }

  // Extract Core Web Vitals (mobile only)
  let vitals: CoreWebVitals | undefined
  if (strategy === 'mobile') {
    vitals = {
      fcp: {
        value: audits['first-contentful-paint']?.displayValue || 'N/A',
        score: audits['first-contentful-paint']?.score || 0,
      },
      lcp: {
        value: audits['largest-contentful-paint']?.displayValue || 'N/A',
        score: audits['largest-contentful-paint']?.score || 0,
      },
      tbt: {
        value: audits['total-blocking-time']?.displayValue || 'N/A',
        score: audits['total-blocking-time']?.score || 0,
      },
      cls: {
        value: audits['cumulative-layout-shift']?.displayValue || 'N/A',
        score: audits['cumulative-layout-shift']?.score || 0,
      },
      si: {
        value: audits['speed-index']?.displayValue || 'N/A',
        score: audits['speed-index']?.score || 0,
      },
    }
  }

  // Extract issues
  const issues: SEOIssue[] = []
  for (const [key, audit] of Object.entries(audits) as [string, any][]) {
    if (
      audit.score !== null &&
      typeof audit.score === 'number' &&
      audit.score < 0.9 &&
      audit.title &&
      audit.description
    ) {
      const severity: 'high' | 'medium' | 'low' =
        audit.score < 0.5 ? 'high' : audit.score < 0.7 ? 'medium' : 'low'

      // Determine category
      let category = 'technical'
      if (key.includes('image') || key.includes('font') || key.includes('css'))
        category = 'performance'
      if (key.includes('aria') || key.includes('label') || key.includes('contrast'))
        category = 'accessibility'
      if (key.includes('meta') || key.includes('link') || key.includes('canonical'))
        category = 'seo'

      issues.push({
        severity,
        title: audit.title,
        description: audit.displayValue || '',
        category,
      })
    }
  }

  // Sort: high first
  issues.sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 }
    return order[a.severity] - order[b.severity]
  })

  return { scores, vitals, issues: issues.slice(0, 10) }
}

export async function getPageSpeedData(domain: string): Promise<PageSpeedResult> {
  const [mobileResult, desktopResult] = await Promise.all([
    fetchLighthouse(domain, 'mobile'),
    fetchLighthouse(domain, 'desktop'),
  ])

  return {
    mobile: mobileResult.scores,
    desktop: desktopResult.scores,
    coreWebVitals: mobileResult.vitals!,
    issues: [...mobileResult.issues, ...desktopResult.issues].slice(0, 15),
    fetchedAt: new Date().toISOString(),
  }
}
