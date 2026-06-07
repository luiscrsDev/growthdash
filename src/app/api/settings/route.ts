import { NextRequest, NextResponse } from 'next/server'
import {
  getProjectCredentials,
  saveProjectCredentials,
  getGlobalCredentials,
  saveGlobalCredentials,
  type ProjectCredentials,
} from '@/lib/settings-store'
import { projects } from '@/config/projects'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS() {
  return NextResponse.json(null, { status: 204, headers: corsHeaders })
}

// GET /api/settings?project=filahive  (returns masked credentials status)
// GET /api/settings                    (returns all projects' status)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('project')

    if (projectId) {
      const creds = await getProjectCredentials(projectId)
      const global = await getGlobalCredentials()
      const project = projects.find((p) => p.id === projectId)

      return NextResponse.json(
        {
          project: projectId,
          integrations: project?.integrations ?? {},
          credentials: maskCredentials({ ...global, ...creds }),
          configured: getConfiguredStatus({ ...global, ...creds }, project?.integrations),
        },
        { headers: corsHeaders }
      )
    }

    // All projects
    const global = await getGlobalCredentials()
    const result = await Promise.all(
      projects.map(async (p) => {
        const creds = await getProjectCredentials(p.id)
        const merged = { ...global, ...creds }
        return {
          project: p.id,
          name: p.name,
          integrations: p.integrations,
          configured: getConfiguredStatus(merged, p.integrations),
        }
      })
    )

    return NextResponse.json({ projects: result, hasKV: !!process.env.KV_REST_API_URL }, { headers: corsHeaders })
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Failed to read settings', detail: err.message },
      { status: 500, headers: corsHeaders }
    )
  }
}

// POST /api/settings
// Body: { project?: string, credentials: ProjectCredentials }
// If project is omitted, saves as global
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { project, credentials } = body as {
      project?: string
      credentials: ProjectCredentials
    }

    if (!credentials || typeof credentials !== 'object') {
      return NextResponse.json(
        { error: 'Missing credentials object in body' },
        { status: 400, headers: corsHeaders }
      )
    }

    if (project) {
      await saveProjectCredentials(project, credentials)
    } else {
      await saveGlobalCredentials(credentials)
    }

    return NextResponse.json(
      { success: true, scope: project ?? 'global' },
      { headers: corsHeaders }
    )
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Failed to save settings', detail: err.message },
      { status: 500, headers: corsHeaders }
    )
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function maskCredentials(creds: ProjectCredentials): Record<string, string> {
  const masked: Record<string, string> = {}
  for (const [key, value] of Object.entries(creds)) {
    if (value && typeof value === 'string' && value.length > 0) {
      if (value.length <= 8) {
        masked[key] = '****'
      } else {
        masked[key] = value.slice(0, 4) + '****' + value.slice(-4)
      }
    } else {
      masked[key] = ''
    }
  }
  return masked
}

function getConfiguredStatus(
  creds: ProjectCredentials,
  integrations?: Record<string, boolean>
): Record<string, boolean> {
  const status: Record<string, boolean> = {}

  if (integrations?.pagespeed) {
    status.pagespeed = !!(creds.pagespeedApiKey || process.env.GOOGLE_PAGESPEED_API_KEY)
  }
  if (integrations?.searchConsole) {
    status.searchConsole = !!(creds.serviceAccountJson || process.env.GOOGLE_SERVICE_ACCOUNT_JSON)
  }
  if (integrations?.shopify) {
    status.shopify = !!(
      (creds.shopifyDomain || process.env.FILAHIVE_SHOPIFY_DOMAIN) &&
      (creds.shopifyToken || process.env.FILAHIVE_SHOPIFY_TOKEN)
    )
  }
  if (integrations?.googleAds) {
    status.googleAds = !!(creds.googleAdsCid || process.env.APLUS_GOOGLE_ADS_CID)
  }

  return status
}
