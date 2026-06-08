import { NextRequest, NextResponse } from "next/server";
import { resolveCredential } from "@/lib/settings-store";
import { getProject } from "@/lib/projects";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DailyRow {
  date: string;
  impressions: number;
  clicks: number;
  ctr: number;
  position: number;
}

interface SearchConsoleTotals {
  impressions: number;
  clicks: number;
  ctr: number;
  avgPosition: number;
}

interface SearchConsoleResponse {
  domain: string;
  days: number;
  mock: boolean;
  fetchedAt: string;
  totals: SearchConsoleTotals;
  daily: DailyRow[];
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
// Mock data generator
// ---------------------------------------------------------------------------

function generateMockData(domain: string, days: number): SearchConsoleResponse {
  const daily: DailyRow[] = [];
  const now = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const impressions = Math.floor(800 + Math.random() * 400);
    const clicks = Math.floor(impressions * (0.03 + Math.random() * 0.04));
    daily.push({
      date: d.toISOString().slice(0, 10),
      impressions,
      clicks,
      ctr: Number((clicks / impressions).toFixed(4)),
      position: Number((8 + Math.random() * 12).toFixed(1)),
    });
  }

  const totalImpressions = daily.reduce((s, r) => s + r.impressions, 0);
  const totalClicks = daily.reduce((s, r) => s + r.clicks, 0);

  return {
    domain,
    days,
    mock: true,
    fetchedAt: new Date().toISOString(),
    totals: {
      impressions: totalImpressions,
      clicks: totalClicks,
      ctr: Number((totalClicks / totalImpressions).toFixed(4)),
      avgPosition: Number(
        (daily.reduce((s, r) => s + r.position, 0) / daily.length).toFixed(1)
      ),
    },
    daily,
  };
}

// ---------------------------------------------------------------------------
// OPTIONS
// ---------------------------------------------------------------------------

export async function OPTIONS() {
  return NextResponse.json(null, { status: 204, headers: corsHeaders });
}

// ---------------------------------------------------------------------------
// GET /api/search-console?project=filahive  (or ?domain=xxx for backwards compat)
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("project") || "filahive";
    const project = getProject(projectId);
    const daysParam = searchParams.get("days") || "7";
    const days = parseInt(daysParam, 10);

    // Resolve domain — query param > project config
    const domain = searchParams.get("domain") || project?.domain;

    if (!domain) {
      return NextResponse.json(
        { error: "Cannot resolve domain. Provide ?domain= or a valid ?project=" },
        { status: 400, headers: corsHeaders }
      );
    }

    if (![7, 30].includes(days)) {
      return NextResponse.json(
        { error: "days must be 7 or 30" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Resolve credentials: KV settings → env var
    const saJson = await resolveCredential(projectId, "serviceAccountJson");
    if (!saJson) {
      const mockData = generateMockData(domain, days);
      return NextResponse.json(mockData, { headers: corsHeaders });
    }

    // Real Google Search Console API call
    const { google } = await import("googleapis");

    const credentials = JSON.parse(saJson);
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ["https://www.googleapis.com/auth/webmasters.readonly"],
    });

    const searchconsole = google.searchconsole({ version: "v1", auth });

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const formatDate = (d: Date) => d.toISOString().slice(0, 10);

    // Use project-specific siteUrl if available
    const siteUrl = project?.searchConsole?.siteUrl
      || (domain.startsWith("http") ? domain : `sc-domain:${domain}`);

    const response = await searchconsole.searchanalytics.query({
      siteUrl,
      requestBody: {
        startDate: formatDate(startDate),
        endDate: formatDate(endDate),
        dimensions: ["date"],
        rowLimit: days,
      },
    });

    const rows = response.data.rows ?? [];

    const daily: DailyRow[] = rows.map((r: any) => ({
      date: r.keys?.[0] ?? "",
      impressions: r.impressions ?? 0,
      clicks: r.clicks ?? 0,
      ctr: Number((r.ctr ?? 0).toFixed(4)),
      position: Number((r.position ?? 0).toFixed(1)),
    }));

    const totalImpressions = daily.reduce((s, r) => s + r.impressions, 0);
    const totalClicks = daily.reduce((s, r) => s + r.clicks, 0);

    const data: SearchConsoleResponse = {
      domain,
      days,
      mock: false,
      fetchedAt: new Date().toISOString(),
      totals: {
        impressions: totalImpressions,
        clicks: totalClicks,
        ctr: totalImpressions > 0
          ? Number((totalClicks / totalImpressions).toFixed(4))
          : 0,
        avgPosition: daily.length > 0
          ? Number(
              (daily.reduce((s, r) => s + r.position, 0) / daily.length).toFixed(1)
            )
          : 0,
      },
      daily,
    };

    return NextResponse.json(data, { headers: corsHeaders });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Internal server error", detail: err.message },
      { status: 500, headers: corsHeaders }
    );
  }
}
