/**
 * Settings store — reads credentials from KV (Vercel KV) or falls back to env vars.
 * For local dev without KV, env vars work as before.
 *
 * Storage: Vercel KV (free tier) if KV_REST_API_URL is set,
 * otherwise in-memory map (resets on cold start — fine for dev).
 */

// In-memory fallback for local dev
const memoryStore = new Map<string, string>()

// ---------------------------------------------------------------------------
// KV helpers (only used when Vercel KV is configured)
// ---------------------------------------------------------------------------

async function kvSet(key: string, value: string): Promise<void> {
  const url = process.env.KV_REST_API_URL
  const token = process.env.KV_REST_API_TOKEN
  if (!url || !token) {
    memoryStore.set(key, value)
    return
  }
  await fetch(`${url}/set/${encodeURIComponent(key)}/${encodeURIComponent(value)}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  })
}

async function kvGet(key: string): Promise<string | null> {
  const url = process.env.KV_REST_API_URL
  const token = process.env.KV_REST_API_TOKEN
  if (!url || !token) {
    return memoryStore.get(key) ?? null
  }
  const res = await fetch(`${url}/get/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  })
  const data = await res.json()
  return data.result ?? null
}

async function kvDel(key: string): Promise<void> {
  const url = process.env.KV_REST_API_URL
  const token = process.env.KV_REST_API_TOKEN
  if (!url || !token) {
    memoryStore.delete(key)
    return
  }
  await fetch(`${url}/del/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  })
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface ProjectCredentials {
  pagespeedApiKey?: string
  serviceAccountJson?: string
  shopifyDomain?: string
  shopifyToken?: string
  googleAdsCid?: string
}

const SETTINGS_PREFIX = 'growthdash:creds:'

export async function getProjectCredentials(projectId: string): Promise<ProjectCredentials> {
  const raw = await kvGet(`${SETTINGS_PREFIX}${projectId}`)
  if (raw) {
    try {
      return JSON.parse(raw)
    } catch {
      return {}
    }
  }
  return {}
}

export async function saveProjectCredentials(projectId: string, creds: ProjectCredentials): Promise<void> {
  // Merge with existing to allow partial updates
  const existing = await getProjectCredentials(projectId)
  const merged = { ...existing, ...creds }

  // Remove empty strings
  for (const key of Object.keys(merged) as (keyof ProjectCredentials)[]) {
    if (merged[key] === '') {
      delete merged[key]
    }
  }

  await kvSet(`${SETTINGS_PREFIX}${projectId}`, JSON.stringify(merged))
}

export async function deleteProjectCredentials(projectId: string): Promise<void> {
  await kvDel(`${SETTINGS_PREFIX}${projectId}`)
}

// Global credentials (shared across projects)
export async function getGlobalCredentials(): Promise<ProjectCredentials> {
  const raw = await kvGet(`${SETTINGS_PREFIX}__global__`)
  if (raw) {
    try {
      return JSON.parse(raw)
    } catch {
      return {}
    }
  }
  return {}
}

export async function saveGlobalCredentials(creds: ProjectCredentials): Promise<void> {
  const existing = await getGlobalCredentials()
  const merged = { ...existing, ...creds }
  for (const key of Object.keys(merged) as (keyof ProjectCredentials)[]) {
    if (merged[key] === '') {
      delete merged[key]
    }
  }
  await kvSet(`${SETTINGS_PREFIX}__global__`, JSON.stringify(merged))
}

// ---------------------------------------------------------------------------
// Resolve credential — checks project-specific, then global, then env var
// ---------------------------------------------------------------------------

const ENV_MAP: Record<keyof ProjectCredentials, string> = {
  pagespeedApiKey: 'GOOGLE_PAGESPEED_API_KEY',
  serviceAccountJson: 'GOOGLE_SERVICE_ACCOUNT_JSON',
  shopifyDomain: 'FILAHIVE_SHOPIFY_DOMAIN',
  shopifyToken: 'FILAHIVE_SHOPIFY_TOKEN',
  googleAdsCid: 'APLUS_GOOGLE_ADS_CID',
}

export async function resolveCredential(
  projectId: string,
  key: keyof ProjectCredentials
): Promise<string | undefined> {
  // 1. Project-specific setting
  const projectCreds = await getProjectCredentials(projectId)
  if (projectCreds[key]) return projectCreds[key]

  // 2. Global setting
  const globalCreds = await getGlobalCredentials()
  if (globalCreds[key]) return globalCreds[key]

  // 3. Environment variable fallback
  return process.env[ENV_MAP[key]] || undefined
}
