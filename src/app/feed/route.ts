import { NextResponse } from "next/server";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeRaw from "rehype-raw";
import rehypeStringify from "rehype-stringify";
import remarkGfm from "remark-gfm";
import remarkHtmlRender from "@/lib/remark-html-render";
import { getPublishedArticlesForFeed } from "@/lib/public-content";
import { getSiteConfig, getSiteUrl } from "@/lib/site";

export const revalidate = 3600;
export const dynamic = "force-dynamic";

function toAbsoluteUrl(url: string, baseUrl: string): string {
  try {
    return new URL(url, `${baseUrl}/`).toString();
  } catch {
    return url;
  }
}

function rehypeAbsoluteUrls({ baseUrl }: { baseUrl: string }) {
  return (tree: unknown) => {
    traverseHast(tree, baseUrl);
  };
}

function traverseHast(node: unknown, baseUrl: string) {
  if (!node || typeof node !== "object") return;

  const maybeNode = node as {
    type?: unknown;
    children?: unknown[];
    properties?: Record<string, unknown>;
  };

  if (maybeNode.type === "element" && maybeNode.properties) {
    rewriteUrlProperties(maybeNode.properties, baseUrl);
  }

  if (!Array.isArray(maybeNode.children)) return;

  for (const child of maybeNode.children) {
    traverseHast(child, baseUrl);
  }
}

function rewriteUrlProperties(
  properties: Record<string, unknown>,
  baseUrl: string
) {
  const urlKeys = ["href", "src", "poster"];
  for (const key of urlKeys) {
    const value = properties[key];
    if (typeof value === "string") {
      properties[key] = toAbsoluteUrl(value, baseUrl);
    }
  }

  const srcSetValue = properties.srcSet ?? properties.srcset;
  if (typeof srcSetValue === "string") {
    const items = srcSetValue
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
      .map((item) => {
        const [url, ...rest] = item.split(/\s+/);
        if (!url) return "";
        const abs = toAbsoluteUrl(url, baseUrl);
        return rest.length > 0 ? `${abs} ${rest.join(" ")}` : abs;
      })
      .filter(Boolean);
    properties.srcSet = items.join(", ");
    delete properties.srcset;
  }
}

function renderMarkdownToHtml(markdown: string, baseUrl: string): string {
  const result = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkHtmlRender)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeAbsoluteUrls, { baseUrl })
    .use(rehypeStringify, { allowDangerousHtml: true })
    .processSync(markdown);

  return String(result);
}
export async function GET() {
  try {
    const [baseUrl, siteConfig, articles] = await Promise.all([
      getSiteUrl(),
      getSiteConfig(),
      getPublishedArticlesForFeed(),
    ]);

    const lastUpdated = articles.length > 0
      ? articles.reduce(
          (latest: Date, article: (typeof articles)[number]) =>
            article.updatedAt > latest ? article.updatedAt : latest,
          articles[0].updatedAt
        ).toISOString()
      : new Date().toISOString();

    const escapeXml = (str: string): string => {
      return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");
    };

    const entries = articles.map((article: (typeof articles)[number]) => {
      const authorName = article.author.nickname || article.author.username;
      const publishedAt = article.publishedAt?.toISOString() || article.createdAt.toISOString();
      const updatedAt = article.updatedAt.toISOString();
      const articleUrl = `${baseUrl}/article/${article.id}`;

      const summary = article.summary || article.content.slice(0, 200) + "...";
      const contentHtml = renderMarkdownToHtml(article.content, baseUrl);

      return `  <entry>
    <title>${escapeXml(article.title)}</title>
    <link href="${escapeXml(articleUrl)}" rel="alternate" type="text/html"/>
    <id>${escapeXml(articleUrl)}</id>
    <published>${publishedAt}</published>
    <updated>${updatedAt}</updated>
    <author>
      <name>${escapeXml(authorName)}</name>
    </author>
    <summary type="html">${escapeXml(summary)}</summary>
    <content type="html">${escapeXml(contentHtml)}</content>
  </entry>`;
    }).join("\n");

    const atomFeed = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>${siteConfig.name}</title>
  <subtitle>${siteConfig.tagline}</subtitle>
  <link href="${baseUrl}/feed" rel="self" type="application/atom+xml"/>
  <link href="${baseUrl}" rel="alternate" type="text/html"/>
  <id>${baseUrl}/</id>
  <updated>${lastUpdated}</updated>
  <generator>Memoir</generator>
${entries}
</feed>`;

    return new NextResponse(atomFeed, {
      status: 200,
      headers: {
        "Content-Type": "application/atom+xml; charset=utf-8",
      },
    });
  } catch (error) {
    console.error("Generate feed error:", error);
    return NextResponse.json(
      { detail: "服务器内部错误" },
      { status: 500 }
    );
  }
}
