import { NextRequest, NextResponse } from "next/server";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TopProduct {
  title: string;
  totalSold: number;
  revenue: number;
}

interface ShopifyResponse {
  store: string;
  mock: boolean;
  fetchedAt: string;
  totalProducts: number;
  totalOrders: number;
  revenue: number;
  currency: string;
  topProducts: TopProduct[];
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
// Mock data
// ---------------------------------------------------------------------------

function generateMockData(store: string): ShopifyResponse {
  return {
    store,
    mock: true,
    fetchedAt: new Date().toISOString(),
    totalProducts: 47,
    totalOrders: 132,
    revenue: 8745.5,
    currency: "BRL",
    topProducts: [
      { title: "Vaso Moderno Espiral", totalSold: 28, revenue: 2240.0 },
      { title: "Suporte para Headset RGB", totalSold: 22, revenue: 1540.0 },
      { title: "Porta Lapis Geometrico", totalSold: 19, revenue: 950.0 },
      { title: "Organizador de Cabos", totalSold: 15, revenue: 675.0 },
      { title: "Luminaria Articulada", totalSold: 12, revenue: 1080.0 },
    ],
  };
}

// ---------------------------------------------------------------------------
// Shopify Admin REST helper
// ---------------------------------------------------------------------------

async function shopifyFetch<T>(
  shopDomain: string,
  token: string,
  endpoint: string,
  params?: Record<string, string>
): Promise<T> {
  const url = new URL(`https://${shopDomain}/admin/api/2024-04/${endpoint}`);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      url.searchParams.set(k, v);
    }
  }

  const res = await fetch(url.toString(), {
    headers: {
      "X-Shopify-Access-Token": token,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Shopify API ${res.status}: ${body}`);
  }

  return res.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// OPTIONS (CORS pre-flight)
// ---------------------------------------------------------------------------

export async function OPTIONS() {
  return NextResponse.json(null, { status: 204, headers: corsHeaders });
}

// ---------------------------------------------------------------------------
// GET /api/shopify?store=xxx
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const store = searchParams.get("store");

    if (!store) {
      return NextResponse.json(
        { error: "Missing required parameter: store" },
        { status: 400, headers: corsHeaders }
      );
    }

    const shopDomain = process.env.FILAHIVE_SHOPIFY_DOMAIN;
    const token = process.env.FILAHIVE_SHOPIFY_TOKEN;

    // If no credentials, return mock data
    if (!shopDomain || !token) {
      return NextResponse.json(generateMockData(store), {
        headers: corsHeaders,
      });
    }

    // --- Total products ---
    const productsCount = await shopifyFetch<{ count: number }>(
      shopDomain,
      token,
      "products/count.json"
    );

    // --- Orders from last 30 days ---
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const ordersData = await shopifyFetch<{ orders: any[] }>(
      shopDomain,
      token,
      "orders.json",
      {
        status: "any",
        created_at_min: thirtyDaysAgo.toISOString(),
        limit: "250",
        fields: "id,line_items,total_price,currency",
      }
    );

    const orders = ordersData.orders ?? [];

    // Calculate revenue
    const revenue = orders.reduce(
      (sum, o) => sum + parseFloat(o.total_price || "0"),
      0
    );
    const currency = orders[0]?.currency || "BRL";

    // Aggregate product sales
    const productSales = new Map<
      string,
      { title: string; totalSold: number; revenue: number }
    >();

    for (const order of orders) {
      for (const item of order.line_items ?? []) {
        const title: string = item.title ?? "Unknown";
        const existing = productSales.get(title) ?? {
          title,
          totalSold: 0,
          revenue: 0,
        };
        existing.totalSold += item.quantity ?? 0;
        existing.revenue += parseFloat(item.price || "0") * (item.quantity ?? 0);
        productSales.set(title, existing);
      }
    }

    const topProducts: TopProduct[] = Array.from(productSales.values())
      .sort((a, b) => b.totalSold - a.totalSold)
      .slice(0, 5)
      .map((p) => ({
        title: p.title,
        totalSold: p.totalSold,
        revenue: Math.round(p.revenue * 100) / 100,
      }));

    const data: ShopifyResponse = {
      store,
      mock: false,
      fetchedAt: new Date().toISOString(),
      totalProducts: productsCount.count ?? 0,
      totalOrders: orders.length,
      revenue: Math.round(revenue * 100) / 100,
      currency,
      topProducts,
    };

    return NextResponse.json(data, { headers: corsHeaders });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Internal server error", detail: err.message },
      { status: 500, headers: corsHeaders }
    );
  }
}
