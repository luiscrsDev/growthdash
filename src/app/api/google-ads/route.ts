import { NextRequest, NextResponse } from "next/server";

// ---------------------------------------------------------------------------
// TODO: Google Ads API integration requires OAuth 2.0 with a refresh token.
//       Steps to implement:
//       1. Create a Google Ads developer token (apply at ads.google.com/aw/apicenter)
//       2. Set up OAuth consent screen in Google Cloud Console
//       3. Generate a refresh token using the OAuth flow
//       4. Use the google-ads-api npm package or googleapis with the Ads service
//       5. Required env vars: GOOGLE_ADS_DEVELOPER_TOKEN, GOOGLE_ADS_CLIENT_ID,
//          GOOGLE_ADS_CLIENT_SECRET, GOOGLE_ADS_REFRESH_TOKEN, GOOGLE_ADS_LOGIN_CUSTOMER_ID
//       6. The API uses GAQL (Google Ads Query Language) for querying metrics
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SearchTerm {
  term: string;
  impressions: number;
  clicks: number;
  conversions: number;
  cost: number;
}

interface GoogleAdsResponse {
  cid: string;
  days: number;
  mock: true;
  fetchedAt: string;
  metrics: {
    impressions: number;
    clicks: number;
    conversions: number;
    cost: number;
    cpc: number;
    ctr: number;
    conversionRate: number;
    costPerConversion: number;
  };
  daily: {
    date: string;
    impressions: number;
    clicks: number;
    conversions: number;
    cost: number;
  }[];
  topSearchTerms: SearchTerm[];
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

function generateMockData(cid: string, days: number): GoogleAdsResponse {
  const daily = [];
  const now = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const impressions = Math.floor(1200 + Math.random() * 800);
    const clicks = Math.floor(impressions * (0.04 + Math.random() * 0.03));
    const conversions = Math.floor(clicks * (0.08 + Math.random() * 0.06));
    const cost = Number((clicks * (1.5 + Math.random() * 2)).toFixed(2));

    daily.push({
      date: d.toISOString().slice(0, 10),
      impressions,
      clicks,
      conversions,
      cost,
    });
  }

  const totalImpressions = daily.reduce((s, r) => s + r.impressions, 0);
  const totalClicks = daily.reduce((s, r) => s + r.clicks, 0);
  const totalConversions = daily.reduce((s, r) => s + r.conversions, 0);
  const totalCost = daily.reduce((s, r) => s + r.cost, 0);

  const topSearchTerms: SearchTerm[] = [
    { term: "property maintenance near me", impressions: 420, clicks: 38, conversions: 5, cost: 76.0 },
    { term: "lawn care service", impressions: 380, clicks: 32, conversions: 4, cost: 64.0 },
    { term: "house cleaning service", impressions: 350, clicks: 28, conversions: 3, cost: 56.0 },
    { term: "pressure washing", impressions: 290, clicks: 22, conversions: 3, cost: 44.0 },
    { term: "gutter cleaning near me", impressions: 210, clicks: 18, conversions: 2, cost: 36.0 },
    { term: "handyman services", impressions: 195, clicks: 15, conversions: 2, cost: 30.0 },
    { term: "exterior painting", impressions: 180, clicks: 14, conversions: 1, cost: 28.0 },
    { term: "fence repair service", impressions: 160, clicks: 12, conversions: 1, cost: 24.0 },
    { term: "deck staining near me", impressions: 140, clicks: 10, conversions: 1, cost: 20.0 },
    { term: "snow removal service", impressions: 120, clicks: 8, conversions: 0, cost: 16.0 },
  ];

  return {
    cid,
    days,
    mock: true,
    fetchedAt: new Date().toISOString(),
    metrics: {
      impressions: totalImpressions,
      clicks: totalClicks,
      conversions: totalConversions,
      cost: Number(totalCost.toFixed(2)),
      cpc: totalClicks > 0 ? Number((totalCost / totalClicks).toFixed(2)) : 0,
      ctr: totalImpressions > 0
        ? Number((totalClicks / totalImpressions).toFixed(4))
        : 0,
      conversionRate: totalClicks > 0
        ? Number((totalConversions / totalClicks).toFixed(4))
        : 0,
      costPerConversion: totalConversions > 0
        ? Number((totalCost / totalConversions).toFixed(2))
        : 0,
    },
    daily,
    topSearchTerms,
  };
}

// ---------------------------------------------------------------------------
// OPTIONS (CORS pre-flight)
// ---------------------------------------------------------------------------

export async function OPTIONS() {
  return NextResponse.json(null, { status: 204, headers: corsHeaders });
}

// ---------------------------------------------------------------------------
// GET /api/google-ads?cid=xxx&days=7
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cid = searchParams.get("cid");
    const daysParam = searchParams.get("days") || "7";
    const days = parseInt(daysParam, 10);

    if (!cid) {
      return NextResponse.json(
        { error: "Missing required parameter: cid (customer ID)" },
        { status: 400, headers: corsHeaders }
      );
    }

    if (isNaN(days) || days < 1 || days > 90) {
      return NextResponse.json(
        { error: "days must be between 1 and 90" },
        { status: 400, headers: corsHeaders }
      );
    }

    // TODO: Replace mock data with real Google Ads API call once OAuth is set up.
    // See the TODO block at the top of this file for implementation steps.
    const data = generateMockData(cid, days);

    return NextResponse.json(data, { headers: corsHeaders });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Internal server error", detail: err.message },
      { status: 500, headers: corsHeaders }
    );
  }
}
