import type { Metadata, Viewport } from "next";
import "./globals.css";
import { RootLayoutShell } from "@/components/RootLayoutShell";
import { getDefaultSiteConfig, getMetadataBase, getSiteConfig } from "@/lib/site";
import { isInstalled } from "@/lib/install";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  if (!isInstalled()) {
    return {
      title: "安装 Memoir",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const [siteConfig, metadataBase] = await Promise.all([
    getSiteConfig(),
    getMetadataBase(),
  ]);

  return {
    metadataBase,
    title: {
      default: siteConfig.title,
      template: `%s | ${siteConfig.name}`,
    },
    description: siteConfig.description,
    keywords: ["博客", "技术", "生活", "云烟成雨"],
    authors: [{ name: siteConfig.name }],
    creator: siteConfig.name,
    openGraph: {
      type: "website",
      locale: "zh_CN",
      siteName: siteConfig.name,
      title: siteConfig.title,
      description: siteConfig.description,
    },
    twitter: {
      card: "summary_large_image",
      title: siteConfig.title,
      description: siteConfig.description,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    alternates: {
      types: {
        "application/atom+xml": "/feed",
      },
    },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const installed = isInstalled();
  const siteConfig = installed ? await getSiteConfig() : getDefaultSiteConfig();

  return (
    <html lang="zh-CN" className="overflow-x-hidden">
      <body
        className="antialiased min-h-screen bg-neutral-50 text-neutral-900 overflow-x-hidden"
      >
        <RootLayoutShell siteName={siteConfig.name}>{children}</RootLayoutShell>
      </body>
    </html>
  );
}
