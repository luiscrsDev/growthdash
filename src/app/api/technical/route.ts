import { NextRequest, NextResponse } from "next/server";
import { getProject } from "@/lib/projects";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SecurityHeader {
  name: string;
  value: string | null;
  present: boolean;
  recommendation?: string;
}

interface TechnicalAuditResponse {
  domain: string;
  fetchedAt: string;
  status: { code: number; text: string };
  https: { enabled: boolean; redirectsToHttps: boolean };
  server: string | null;
  contentType: string | null;
  poweredBy: string | null;
  responseTimeMs: number;
  securityHeaders: SecurityHeader[];
  summary: { score: number; issues: string[]; passed: string[] };
}

// ---------------------------------------------------------------------------
// CORS headers
// ---------------------------------------------------------------------------

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// ---------------------------------------------------------------------------
// Security headers to check
// ---------------------------------------------------------------------------

const SECURITY_HEADERS = [
  { header: "strict-transport-security", label: "Strict-Transport-Security (HSTS)", recommendation: "Add HSTS header with max-age of at least 31536000 (1 year) and includeSubDomains." },
  { header: "x-frame-options", label: "X-Frame-Options", recommendation: "Set to DENY or SAMEORIGIN to prevent clickjacking attacks." },
  { header: "x-content-type-options", label: "X-Content-Type-Options", recommendation: "Set to 'nosniff' to prevent MIME type sniffing." },
  { header: "content-security-policy", label: "Content-Security-Policy", recommendation: "Define a strict CSP to mitigate XSS and data injection attacks." },
  { header: "referrer-policy", label: "Referrer-Policy", recommendation: "Set to 'strict-origin-when-cross-origin' or stricter to limit referrer leakage." },
  { header: "permissions-policy", label: "Permissions-Policy", recommendation: "Restrict browser features like camera, microphone, and geolocation." },
  { header: "x-xss-protection", label: "X-XSS-Protection", recommendation: "Set to '1; mode=block' (legacy but still useful for older browsers)." },
];

// ---------------------------------------------------------------------------
// OPTIONS
// ---------------------------------------------------------------------------

export async function OPTIONS() {
  return NextResponse.json(null, { status: 204, headers: corsHeaders });
}

// ---------------------------------------------------------------------------
// GET /api/technical?project=filahive  (or ?domain=xxx for backwards compat)
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("project") || "filahive";
    const project = getProject(projectId);

    // Resolve domain — query param > project config
    const domain = searchParams.get("domain") || project?.domain;

    if (!domain) {
      return NextResponse.json(
        { error: "Cannot resolve domain. Provide ?domain= or a valid ?project=" },
        { status: 400, headers: corsHeaders }
      );
    }

    const url = domain.startsWith("http") ? domain : `https://${domain}`;

    // Check HTTPS redirect
    let redirectsToHttps = false;
    try {
      const httpUrl = url.replace(/^https:\/\//, "http://");
      const httpRes = await fetch(httpUrl, {
        method: "HEAD",
        redirect: "manual",
        signal: AbortSignal.timeout(10_000),
      });
      const location = httpRes.headers.get("location") || "";
      redirectsToHttps = location.startsWith("https://");
    } catch { /* HTTP version may not exist */ }

    // Main HEAD request
    const startTime = Date.now();
    const res = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
      signal: AbortSignal.timeout(15_000),
    });
    const responseTimeMs = Date.now() - startTime;

    const server = res.headers.get("server");
    const contentType = res.headers.get("content-type");
    const poweredBy = res.headers.get("x-powered-by");

    // Security headers audit
    const securityHeaders: SecurityHeader[] = SECURITY_HEADERS.map((sh) => {
      const value = res.headers.get(sh.header);
      return {
        name: sh.label,
        value,
        present: value !== null,
        recommendation: value === null ? sh.recommendation : undefined,
      };
    });

    // Scoring
    const issues: string[] = [];
    const passed: string[] = [];

    const isHttps = url.startsWith("https://");
    if (isHttps) passed.push("Site uses HTTPS");
    else issues.push("Site does not use HTTPS");

    if (redirectsToHttps) passed.push("HTTP redirects to HTTPS");
    else if (isHttps) issues.push("HTTP does not redirect to HTTPS");

    if (responseTimeMs < 500) passed.push(`Fast server response (${responseTimeMs}ms)`);
    else if (responseTimeMs < 1500) issues.push(`Moderate server response time (${responseTimeMs}ms)`);
    else issues.push(`Slow server response time (${responseTimeMs}ms)`);

    if (poweredBy) issues.push(`X-Powered-By header exposes technology: "${poweredBy}"`);
    else passed.push("X-Powered-By header is hidden");

    for (const sh of securityHeaders) {
      if (sh.present) passed.push(`${sh.name} is set`);
      else issues.push(`Missing ${sh.name}`);
    }

    const deductionPerIssue = Math.floor(100 / (issues.length + passed.length + 1));
    const score = Math.max(0, 100 - issues.length * deductionPerIssue);

    const data: TechnicalAuditResponse = {
      domain,
      fetchedAt: new Date().toISOString(),
      status: { code: res.status, text: res.statusText },
      https: { enabled: isHttps, redirectsToHttps },
      server,
      contentType,
      poweredBy,
      responseTimeMs,
      securityHeaders,
      summary: { score, issues, passed },
    };

    return NextResponse.json(data, { headers: corsHeaders });
  } catch (err: any) {
    if (err.name === "TimeoutError" || err.message?.includes("timeout")) {
      return NextResponse.json(
        { error: "Request timed out", detail: "The domain did not respond within 15 seconds" },
        { status: 504, headers: corsHeaders }
      );
    }
    return NextResponse.json(
      { error: "Internal server error", detail: err.message },
      { status: 500, headers: corsHeaders }
    );
  }
}
