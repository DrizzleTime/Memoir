import { Children, isValidElement } from "react";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";
import ImageGallery from "./ImageGallery";
import MarkdownImage from "./MarkdownImage";
import { cn } from "@/lib/cn";
import remarkHtmlRender from "@/lib/remark-html-render";
import LinkPreviewCard from "@/components/LinkPreviewCard";
import { getStandaloneUrlFromParagraph } from "@/lib/markdown-standalone-link";
import CodeBlock from "@/components/CodeBlock";
import { parseMarkdownImageLine } from "@/lib/markdown-image";

type MarkdownViewVariant = "article" | "comment" | "memo" | "editor";

type HastText = {
  type: "text";
  value: string;
};

type HastElement = {
  type: "element";
  tagName: string;
  properties?: Record<string, unknown>;
  children?: unknown[];
};

interface MarkdownViewProps {
  content: string;
  variant?: MarkdownViewVariant;
  className?: string;
}

interface ContentBlock {
  type: "markdown" | "gallery";
  content: string;
  images?: { src: string; alt: string }[];
}

function parseContentBlocks(
  content: string,
  { enableGallery }: { enableGallery: boolean }
): ContentBlock[] {
  const lines = content.split("\n");
  const blocks: ContentBlock[] = [];

  let currentMarkdown: string[] = [];
  let currentImages: { src: string; alt: string; raw: string }[] = [];

  const flushMarkdown = () => {
    if (currentMarkdown.length === 0) return;
    const text = currentMarkdown.join("\n").trim();
    if (text) {
      blocks.push({ type: "markdown", content: text });
    }
    currentMarkdown = [];
  };

  const flushImages = () => {
    if (currentImages.length === 0) return;

    if (enableGallery && currentImages.length > 2) {
      blocks.push({
        type: "gallery",
        content: "",
        images: currentImages.map(({ src, alt }) => ({ src, alt })),
      });
    } else {
      for (const img of currentImages) {
        blocks.push({
          type: "markdown",
          content: img.raw,
        });
      }
    }

    currentImages = [];
  };

  for (const line of lines) {
    const parsed = parseMarkdownImageLine(line);

    if (parsed) {
      flushMarkdown();
      currentImages.push({ alt: parsed.alt, src: parsed.src, raw: parsed.raw });
      continue;
    }

    if (line.trim() === "" && currentImages.length > 0) {
      currentMarkdown.push(line);
      continue;
    }

    flushImages();
    currentMarkdown.push(line);
  }

  flushImages();
  flushMarkdown();

  return blocks;
}

function mergeMarkdownBlocks(blocks: ContentBlock[]): ContentBlock[] {
  const merged: ContentBlock[] = [];

  for (const block of blocks) {
    if (
      block.type === "markdown" &&
      merged.length > 0 &&
      merged[merged.length - 1].type === "markdown"
    ) {
      merged[merged.length - 1].content += "\n\n" + block.content;
    } else {
      merged.push(block);
    }
  }

  return merged;
}

function isTextNode(node: unknown): node is HastText {
  if (!node || typeof node !== "object") return false;
  const maybe = node as Partial<HastText>;
  return maybe.type === "text" && typeof maybe.value === "string";
}

function isElementNode(node: unknown): node is HastElement {
  if (!node || typeof node !== "object") return false;
  const maybe = node as Partial<HastElement>;
  return maybe.type === "element" && typeof maybe.tagName === "string";
}

function isMeaningfulChild(node: unknown): boolean {
  if (isTextNode(node)) return node.value.trim() !== "";
  return true;
}

function getStandaloneImageFromParagraph(
  node: unknown
): { src: string; alt: string; title?: string } | null {
  if (!node || typeof node !== "object") return null;

  const children = (node as { children?: unknown[] }).children;
  if (!Array.isArray(children)) return null;

  const meaningful = children.filter(isMeaningfulChild);
  if (meaningful.length !== 1) return null;

  const only = meaningful[0];
  if (!isElementNode(only) || only.tagName !== "img") return null;

  const src = only.properties?.src;
  if (typeof src !== "string") return null;

  const normalizedSrc = src.trim();
  if (!normalizedSrc) return null;

  const alt = only.properties?.alt;
  const title = only.properties?.title;

  return {
    src: normalizedSrc,
    alt: typeof alt === "string" ? alt : "",
    title: typeof title === "string" ? title : undefined,
  };
}

export default function MarkdownView({
  content,
  variant = "article",
  className,
}: MarkdownViewProps) {
  const allowHtml = variant !== "comment";
  const blocks = mergeMarkdownBlocks(
    parseContentBlocks(content, { enableGallery: true })
  );

  const proseClassName = cn(
    "prose prose-neutral max-w-none break-words",
    (variant === "article" || variant === "editor") && "overflow-x-hidden",
    variant === "memo" && "prose-sm",
    variant === "comment" && "mb-2",
    className
  );

  const remarkPlugins = allowHtml ? [remarkGfm, remarkHtmlRender] : [remarkGfm];
  const rehypePlugins = allowHtml ? [rehypeRaw] : [];

  return (
    <div className={proseClassName}>
      {blocks.map((block, blockIndex) => {
        if (block.type === "gallery" && block.images) {
          return <ImageGallery key={blockIndex} images={block.images} />;
        }

        return (
          <ReactMarkdown
            key={blockIndex}
            skipHtml={!allowHtml}
            remarkPlugins={remarkPlugins}
            rehypePlugins={rehypePlugins}
            components={{
              p: ({ node, children, ...props }) => {
                const url = getStandaloneUrlFromParagraph(node);
                if (url) {
                  return <LinkPreviewCard key={url} url={url} />;
                }

                const standaloneImage = getStandaloneImageFromParagraph(node);
                if (standaloneImage) {
                  const rounded = variant === "comment" || variant === "memo";
                  const title = (standaloneImage.title ?? "").trim();
                  const alt = standaloneImage.alt.trim();
                  const caption = title || alt;

                  return (
                    <figure>
                      <MarkdownImage
                        src={standaloneImage.src}
                        alt={standaloneImage.alt}
                        title={standaloneImage.title}
                        loading="lazy"
                        className={cn(
                          "max-w-full h-auto",
                          rounded && "rounded-lg"
                        )}
                      />
                      {caption ? (
                        <figcaption className="mt-2 text-xs text-neutral-500 text-center">
                          {caption}
                        </figcaption>
                      ) : null}
                    </figure>
                  );
                }

                return <p {...props}>{children}</p>;
              },
              pre: ({ node, children, ...props }) => {
                void node;
                const nodes = Children.toArray(children);
                const first = nodes[0];

                if (isValidElement(first) && first.type === "code") {
                  const codeClassName = (first.props as { className?: string }).className;
                  const match = /language-(\w+)/.exec(codeClassName || "");
                  const language = match?.[1];
                  const code = String(
                    (first.props as { children?: unknown }).children ?? ""
                  ).replace(/\n$/, "");

                  return <CodeBlock code={code} language={language} />;
                }

                return <pre {...props}>{children}</pre>;
              },
              a: ({ node, href, children, ...props }) => {
                void node;
                const isExternal =
                  typeof href === "string" &&
                  (href.startsWith("http://") || href.startsWith("https://"));

                return (
                  <a
                    href={href}
                    {...props}
                    target={isExternal ? "_blank" : undefined}
                    rel={isExternal ? "noopener noreferrer nofollow" : undefined}
                  >
                    {children}
                  </a>
                );
              },
              img: ({ node, src, alt, ...props }) => {
                void node;
                if (typeof src !== "string") return null;

                const normalizedSrc = src.trim();
                if (!normalizedSrc) return null;

                return (
                  <MarkdownImage
                    src={normalizedSrc}
                    alt={alt || ""}
                    loading="lazy"
                    {...props}
                    className={cn(
                      "max-w-full h-auto",
                      (variant === "comment" || variant === "memo") && "rounded-lg",
                      props.className
                    )}
                  />
                );
              },
            }}
          >
            {block.content}
          </ReactMarkdown>
        );
      })}
    </div>
  );
}
