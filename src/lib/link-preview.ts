import { isBlockedHost, normalizeHttpUrl } from "@/lib/url-safety";

export interface LinkPreview {
  url: string;
  title: string;
  description: string;
  image: string | null;
  favicon: string | null;
  siteName: string;
}

const previewCache = new Map<string, LinkPreview>();
const PREVIEW_CACHE_MAX_SIZE = 200;

const USER_AGENT =
  "Mozilla/5.0 (compatible; MemoirLinkPreview/1.0; +https://localhost)";

export async function getLinkPreview(urlInput: string): Promise<LinkPreview> {
  const normalizedUrl = normalizeHttpUrl(urlInput);
  const cached = previewCache.get(normalizedUrl);
  if (cached) return cached;

  const url = new URL(normalizedUrl);
  if (isBlockedHost(url.hostname)) {
    throw new Error("不支持预览该地址");
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(url.toString(), {
      redirect: "follow",
      cache: "no-store",
      signal: controller.signal,
      headers: {
        "user-agent": USER_AGENT,
        accept: "text/html,application/xhtml+xml",
      },
    });

    const html = await res.text();

    const baseUrl = url.toString();
    const meta = parseOpenGraph(html, baseUrl);

    const fallbackSiteName = url.hostname.replace(/^www\./, "");
    const preview: LinkPreview = {
      url: baseUrl,
      title:
        meta.title || meta.twitterTitle || meta.htmlTitle || fallbackSiteName,
      description:
        meta.description || meta.twitterDescription || meta.htmlDescription || "",
      image: meta.image || meta.twitterImage,
      favicon: new URL("/favicon.ico", baseUrl).toString(),
      siteName: meta.siteName || fallbackSiteName,
    };

    preview.title = clampText(preview.title, 120);
    preview.description = clampText(preview.description, 200);

    setPreviewCache(normalizedUrl, preview);
    return preview;
  } finally {
    clearTimeout(timer);
  }
}

function setPreviewCache(url: string, preview: LinkPreview) {
  if (previewCache.size >= PREVIEW_CACHE_MAX_SIZE) {
    const oldestKey = previewCache.keys().next().value;
    if (oldestKey) {
      previewCache.delete(oldestKey);
    }
  }
  previewCache.set(url, preview);
}

type ParsedMeta = {
  title: string | null;
  description: string | null;
  image: string | null;
  siteName: string | null;
  twitterTitle: string | null;
  twitterDescription: string | null;
  twitterImage: string | null;
  htmlTitle: string | null;
  htmlDescription: string | null;
};

function parseOpenGraph(html: string, baseUrl: string): ParsedMeta {
  const metaTags = extractTags(html, "meta");

  const ogTitle = findMeta(metaTags, "property", "og:title");
  const ogDescription = findMeta(metaTags, "property", "og:description");
  const ogImage = findMeta(metaTags, "property", "og:image");
  const ogSiteName = findMeta(metaTags, "property", "og:site_name");

  const twitterTitle = findMeta(metaTags, "name", "twitter:title");
  const twitterDescription = findMeta(metaTags, "name", "twitter:description");
  const twitterImage = findMeta(metaTags, "name", "twitter:image");

  const htmlTitle = extractTitle(html);
  const htmlDescription = findMeta(metaTags, "name", "description");

  return {
    title: normalizeText(ogTitle),
    description: normalizeText(ogDescription),
    image: resolveMaybeUrl(ogImage, baseUrl),
    siteName: normalizeText(ogSiteName),
    twitterTitle: normalizeText(twitterTitle),
    twitterDescription: normalizeText(twitterDescription),
    twitterImage: resolveMaybeUrl(twitterImage, baseUrl),
    htmlTitle: normalizeText(htmlTitle),
    htmlDescription: normalizeText(htmlDescription),
  };
}

function extractTags(html: string, tagName: string): string[] {
  const re = new RegExp(`<${tagName}\\s+[^>]*>`, "gi");
  return html.match(re) || [];
}

function findMeta(
  metaTags: string[],
  key: "property" | "name",
  keyValue: string
): string | null {
  const desiredKey = key.toLowerCase();
  const desiredValue = keyValue.toLowerCase();

  for (const tag of metaTags) {
    const attrs = parseAttributes(tag);
    const foundKey = attrs[desiredKey];
    if (!foundKey) continue;
    if (foundKey.toLowerCase() !== desiredValue) continue;
    const content = attrs.content;
    if (content) return decodeHtmlEntities(content);
  }
  return null;
}

function parseAttributes(tag: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  const re =
    /([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(tag)) !== null) {
    const name = match[1].toLowerCase();
    const value = match[2] ?? match[3] ?? "";
    attrs[name] = value;
  }
  return attrs;
}

function extractTitle(html: string): string | null {
  const match = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  if (!match) return null;
  return decodeHtmlEntities(match[1]);
}

function resolveMaybeUrl(url: string | null, baseUrl: string): string | null {
  if (!url) return null;
  try {
    return new URL(url, baseUrl).toString();
  } catch {
    return null;
  }
}

function normalizeText(text: string | null): string | null {
  if (!text) return null;
  const decoded = decodeHtmlEntities(text);
  const normalized = decoded.replace(/\s+/g, " ").trim();
  return normalized || null;
}

function clampText(text: string, max: number): string {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (normalized.length <= max) return normalized;
  return normalized.slice(0, max - 1) + "…";
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}
