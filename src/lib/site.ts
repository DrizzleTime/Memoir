import { prisma } from "@/lib/prisma";

const DEV_SITE_URL = "http://localhost:3000";
const NEXT_PHASE_PRODUCTION_BUILD = "phase-production-build";

export const SITE_CONFIG_KEYS = [
  "site_url",
  "site_name",
  "site_title",
  "site_tagline",
  "site_description",
  "site_contact_email",
] as const;

export interface SiteConfig {
  url: string;
  name: string;
  title: string;
  tagline: string;
  description: string;
  contactEmail: string;
}

const DEFAULT_SITE_CONFIG: SiteConfig = {
  url: DEV_SITE_URL,
  name: "Memoir",
  title: "Memoir",
  tagline: "个人博客系统",
  description: "一个基于 Next.js 的个人博客系统。",
  contactEmail: "admin@example.com",
};

let siteConfigCache: SiteConfig | null = null;
let siteConfigPromise: Promise<SiteConfig> | null = null;

function getStoredValue(configMap: Map<string, string>, key: string, fallback: string) {
  const value = configMap.get(key)?.trim();
  return value || fallback;
}

export function isSiteConfigKey(key: string): boolean {
  return SITE_CONFIG_KEYS.includes(key as (typeof SITE_CONFIG_KEYS)[number]);
}

export function clearSiteConfigCache() {
  siteConfigCache = null;
  siteConfigPromise = null;
}

export function getDefaultSiteConfig(): SiteConfig {
  return DEFAULT_SITE_CONFIG;
}

export async function getSiteConfig(): Promise<SiteConfig> {
  if (process.env.NEXT_PHASE === NEXT_PHASE_PRODUCTION_BUILD) {
    return DEFAULT_SITE_CONFIG;
  }

  if (siteConfigCache) {
    return siteConfigCache;
  }

  if (!siteConfigPromise) {
    siteConfigPromise = loadSiteConfig();
  }

  try {
    siteConfigCache = await siteConfigPromise;
    return siteConfigCache;
  } catch (error) {
    siteConfigPromise = null;
    throw error;
  }
}

async function loadSiteConfig(): Promise<SiteConfig> {
  const configs = await prisma.config.findMany({
    where: {
      key: { in: [...SITE_CONFIG_KEYS] },
    },
  });

  const configMap = new Map<string, string>(
    configs.map((config: (typeof configs)[number]) => [config.key, config.value])
  );

  return {
    url: normalizeSiteUrl(getStoredValue(configMap, "site_url", getEnvSiteUrl())),
    name: getStoredValue(configMap, "site_name", DEFAULT_SITE_CONFIG.name),
    title: getStoredValue(configMap, "site_title", DEFAULT_SITE_CONFIG.title),
    tagline: getStoredValue(configMap, "site_tagline", DEFAULT_SITE_CONFIG.tagline),
    description: getStoredValue(
      configMap,
      "site_description",
      DEFAULT_SITE_CONFIG.description
    ),
    contactEmail: getStoredValue(
      configMap,
      "site_contact_email",
      DEFAULT_SITE_CONFIG.contactEmail
    ),
  };
}

function normalizeSiteUrl(input: string): string {
  return input.trim().replace(/\/+$/, "");
}

function getEnvSiteUrl(): string {
  const rawSiteUrl = process.env.SITE_URL?.trim();
  const fallbackSiteUrl = DEV_SITE_URL;

  if (rawSiteUrl) {
    try {
      return new URL(normalizeSiteUrl(rawSiteUrl)).toString().replace(/\/$/, "");
    } catch {
      if (process.env.NODE_ENV === "production") {
        throw new Error("SITE_URL 配置无效");
      }

      return fallbackSiteUrl;
    }
  }

  return fallbackSiteUrl;
}

export async function getSiteUrl(): Promise<string> {
  const siteConfig = await getSiteConfig();
  return siteConfig.url;
}

export async function getMetadataBase(): Promise<URL> {
  return new URL(await getSiteUrl());
}

export async function resolveSiteUrl(pathname: string): Promise<string> {
  return new URL(pathname, `${await getSiteUrl()}/`).toString();
}
