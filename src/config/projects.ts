export interface ProjectConfig {
  id: string
  name: string
  domain: string
  description: string
  competitors: string[]
  integrations: {
    pagespeed: boolean
    searchConsole: boolean
    shopify: boolean
    googleAds: boolean
  }
  shopify?: {
    storeDomain: string
    accessToken: string
  }
  googleAds?: {
    customerId: string
  }
  agents: AgentConfig[]
}

export interface AgentConfig {
  id: string
  name: string
  icon: string
  color: string
  enabled: boolean
}

export const projects: ProjectConfig[] = [
  {
    id: 'filahive',
    name: 'FilaHive',
    domain: 'filahive.com',
    description:
      'E-commerce shop selling 3D-printed physical products: fidget spinners, sensory toys, home decor, D&D tabletop accessories. Shopify-powered, free shipping over $35.',
    competitors: [
      'etsy.com',
      'shapeways.com',
      'makerworld.com',
      'thingiverse.com',
      'heroforge.com',
      'dwarvenforge.com',
    ],
    integrations: {
      pagespeed: true,
      searchConsole: true,
      shopify: true,
      googleAds: false,
    },
    shopify: {
      storeDomain: process.env.FILAHIVE_SHOPIFY_DOMAIN || '',
      accessToken: process.env.FILAHIVE_SHOPIFY_TOKEN || '',
    },
    agents: [
      { id: 'reddit', name: 'Reddit agent', icon: 'MessageCircle', color: '#FF4500', enabled: true },
      { id: 'seo', name: 'SEO agent', icon: 'Search', color: '#4ade80', enabled: true },
      { id: 'x', name: 'X agent', icon: 'AtSign', color: '#000', enabled: true },
      { id: 'articles', name: 'Articles agent', icon: 'FileText', color: '#10b981', enabled: true },
      { id: 'linkedin', name: 'LinkedIn agent', icon: 'Linkedin', color: '#0077B5', enabled: true },
    ],
  },
  {
    id: 'aplus',
    name: 'APLUS Property Care',
    domain: 'aplusproperty.care',
    description:
      'Professional property maintenance and cleaning services. Next.js on Vercel. Google Ads campaigns targeting residential and commercial clients.',
    competitors: [
      'thumbtack.com',
      'taskrabbit.com',
      'handy.com',
      'homeadvisor.com',
      'angi.com',
      'molly-maid.com',
    ],
    integrations: {
      pagespeed: true,
      searchConsole: true,
      shopify: false,
      googleAds: true,
    },
    googleAds: {
      customerId: process.env.APLUS_GOOGLE_ADS_CID || '106-780-6098',
    },
    agents: [
      { id: 'seo', name: 'SEO agent', icon: 'Search', color: '#4ade80', enabled: true },
      { id: 'google-ads', name: 'Google Ads agent', icon: 'Target', color: '#4285F4', enabled: true },
      { id: 'reddit', name: 'Reddit agent', icon: 'MessageCircle', color: '#FF4500', enabled: true },
    ],
  },
  {
    id: 'gbs',
    name: 'GlobalBrasilShop',
    domain: 'globalbrasilshop.com',
    description:
      'Brazilian retailer of 3D printers and accessories (Bambu Lab, Snapmaker, Creality). Landing pages per product line. Vercel-hosted.',
    competitors: [
      '3djake.com',
      'matterhackers.com',
      'creality.com',
      'bambulab.com',
      'snapmaker.com',
      'imprimax3d.com.br',
    ],
    integrations: {
      pagespeed: true,
      searchConsole: true,
      shopify: false,
      googleAds: false,
    },
    agents: [
      { id: 'seo', name: 'SEO agent', icon: 'Search', color: '#4ade80', enabled: true },
      { id: 'instagram', name: 'Instagram agent', icon: 'Instagram', color: '#E1306C', enabled: true },
      { id: 'articles', name: 'Articles agent', icon: 'FileText', color: '#10b981', enabled: true },
    ],
  },
]

export function getProject(id: string): ProjectConfig | undefined {
  return projects.find((p) => p.id === id)
}
