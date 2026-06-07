import { projects } from '@/config/projects'

/**
 * Resolves a domain from either a `project` param or a `domain` param.
 * API routes call this to support both ?project=filahive and ?domain=filahive.com
 */
export function resolveDomain(searchParams: URLSearchParams): string | null {
  const projectId = searchParams.get('project')
  const domain = searchParams.get('domain')

  if (projectId) {
    const project = projects.find((p) => p.id === projectId)
    return project?.domain ?? null
  }

  return domain ?? null
}
