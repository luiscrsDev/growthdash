import { NextRequest, NextResponse } from "next/server";
import { resolveCredential } from "@/lib/settings-store";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface LighthouseScore {
  performance: number;
  accessibility: number;
  bestPractices: number;
  seo: number;
}

interface CoreWebVitals {
  lcp: { value: number; unit: string; rating: string };
  fid: { value: number; unit: string; rating: string };
  cls: { value: number; unit: string; rating: string };
  fcp: { value: number; unit: string; rating: string };
  ttfb: { value: number; unit: string; rating: string };
}

interface PageSpeedIssue {
  title: string;
  description: string;
  score: number | null;
  displayValue?: string;
}

interface PageSpeedResponse {
  domain: string;
  strategy: string;
  fetchedAt: string;
  cached: boolean;
  scores: LighthouseScore;
  coreWebVitals: CoreWebVitals;
  topIssues: PageSpeedIssue[];
}

// ---------------------------------------------------------------------------
// In-memory cache (1 hour TTL)
// ---------------------------------------------------------------------------

const cache = new Map<string, { data: PageSpeedResponse; expires: number }>();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

// ---------------------------------------------------------------------------
// CORS headers
// ---------------------------------------------------------------------------

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function ratingFromScore(score: number | null): string {
  if (score === null) return "unknown";
  if (score >= 0.9) return "good";
  if (score >= 0.5) return "needs-improvement";
  return "poor";
}

function extractMetric(
  audits: Record<string, any>,
  key: string,
  unit: string
): { value: number; unit: string; rating: string } {
  const audit = audits[key];
  const value = audit?.numericValue ?? 0;
  const score = audit?.score ?? null;
  return { value: Math.round(value * 100) / 100, unit, rating: ratingFromScore(score) };
}

// ---------------------------------------------------------------------------
// OPTIONS (CORS pre-flight)
// ---------------------------------------------------------------------------

export async function OPTIONS() {
  return NextResponse.json(null, { status: 204, headers: corsHeaders });
}

// ---------------------------------------------------------------------------
// GET /api/pagespeed?domain=xxx&strategy=mobile|desktop
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const domain = searchParams.get("domain");
    const strategy = searchParams.get("strategy") || "mobile";

    if (!domain) {
      return NextResponse.json(
        { error: "Missing required parameter: domain" },
        { status: 400, headers: corsHeaders }
      );
    }

    if (!["mobile", "desktop"].includes(strategy)) {
      return NextResponse.json(
        { error: "strategy must be 'mobile' or 'desktop'" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Resolve API key: KV settings → env var
    const projectId = searchParams.get("project") || "filahive";
    const apiKey = await resolveCredential(projectId, "pagespeedApiKey");
    if (!apiKey) {
      return NextResponse.json(
        { error: "GOOGLE_PAGESPEED_API_KEY is not configured" },
        { status: 500, headers: corsHeaders }
      );
    }

    // Check cache
    const cacheKey = `${domain}:${strategy}`;
    const cached = cache.get(cacheKey);
    if (cached && cached.expires > Date.now()) {
      return NextResponse.json(
        { ...cached.data, cached: true },
        { headers: corsHeaders }
      );
    }

    // Normalise URL
    const url = domain.startsWith("http") ? domain : `https://${domain}`;

    const apiUrl = new URL(
      "https://www.googleapis.com/pagespeedonline/v5/runPagespeed"
    );
    apiUrl.searchParams.set("url", url);
    apiUrl.searchParams.set("strategy", strategy);
    apiUrl.searchParams.set("key", apiKey);
    apiUrl.searchParams.set(
      "category",
      ["PERFORMANCE", "ACCESSIBILITY", "BEST_PRACTICES", "SEO"].join(",")
    );

    const res = await fetch(apiUrl.toString(), { cache: "no-store" });

    if (!res.ok) {
      const body = await res.text();
      return NextResponse.json(
        { error: `PageSpeed API error (${res.status})`, detail: body },
        { status: res.status, headers: corsHeaders }
      );
    }

    const json = await res.json();
    const categories = json.lighthouseResult?.categories ?? {};
    const audits = json.lighthouseResult?.audits ?? {};

    const scores: LighthouseScore = {
      performance: Math.round((categories.performance?.score ?? 0) * 100),
      accessibility: Math.round((categories.accessibility?.score ?? 0) * 100),
      bestPractices: Math.round(
        (categories["best-practices"]?.score ?? 0) * 100
      ),
      seo: Math.round((categories.seo?.score ?? 0) * 100),
    };

    const coreWebVitals: CoreWebVitals = {
      lcp: extractMetric(audits, "largest-contentful-paint", "ms"),
      fid: extractMetric(audits, "max-potential-fid", "ms"),
      cls: extractMetric(audits, "cumulative-layout-shift", ""),
      fcp: extractMetric(audits, "first-contentful-paint", "ms"),
      ttfb: extractMetric(audits, "server-response-time", "ms"),
    };

    // Collect top issues (failed or warning audits sorted by impact)
    const issueAudits = Object.values(audits) as any[];
    const topIssues: PageSpeedIssue[] = issueAudits
      .filter(
        (a: any) =>
          a.score !== null && a.score !== undefined && a.score < 0.9 && a.title
      )
      .sort((a: any, b: any) => (a.score ?? 1) - (b.score ?? 1))
      .slice(0, 10)
      .map((a: any) => ({
        title: a.title,
        description: a.description ?? "",
        score: a.score,
        displayValue: a.displayValue,
      }));

    const data: PageSpeedResponse = {
      domain,
      strategy,
      fetchedAt: new Date().toISOString(),
      cached: false,
      scores,
      coreWebVitals,
      topIssues,
    };

    // Store in cache
    cache.set(cacheKey, { data, expires: Date.now() + CACHE_TTL_MS });

    return NextResponse.json(data, { headers: corsHeaders });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Internal server error", detail: err.message },
      { status: 500, headers: corsHeaders }
    );
  }
}
