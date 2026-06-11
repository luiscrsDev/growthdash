/**
 * Project configuration — maps project IDs to their domains, stores, etc.
 */

export interface ProjectConfig {
  id: string;
  name: string;
  domain: string;
  shopify?: {
    store: string;         // Display name used in the UI
    shopDomain: string;    // e.g. vvwnie-bg.myshopify.com
  };
  googleAds?: {
    customerId: string;    // e.g. 106-780-6098
  };
  searchConsole?: {
    siteUrl: string;       // e.g. sc-domain:filahive.com
  };
}

const PROJECTS: Record<string, ProjectConfig> = {
  filahive: {
    id: "filahive",
    name: "FilaHive",
    domain: "filahive.com",
    shopify: {
      store: "filahive",
      shopDomain: "vvwnie-bg.myshopify.com",
    },
    searchConsole: {
      siteUrl: "https://www.filahive.com/",
    },
  },
  aplus: {
    id: "aplus",
    name: "APLUS Property Care",
    domain: "aplusproperty.care",
    googleAds: {
      customerId: "106-780-6098",
    },
    searchConsole: {
      siteUrl: "sc-domain:aplusproperty.care",
    },
  },
  // NOTE: id must match src/config/projects.ts (frontend uses 'gbs')
  gbs: {
    id: "gbs",
    name: "GlobalBrasilShop",
    domain: "globalbrasilshop.com",
    searchConsole: {
      siteUrl: "sc-domain:globalbrasilshop.com",
    },
  },
};

export function getProject(projectId: string): ProjectConfig | undefined {
  return PROJECTS[projectId];
}

export function listProjects(): ProjectConfig[] {
  return Object.values(PROJECTS);
}
