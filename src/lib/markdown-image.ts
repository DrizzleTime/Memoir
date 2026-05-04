export type MarkdownImage = {
  alt: string;
  src: string;
  title?: string;
};

export type MarkdownImageLine = MarkdownImage & {
  raw: string;
};

const IMAGE_PATTERN = String.raw`!\[([^\]]*)\]\(\s*(<[^>]+>|[^)\s]+)(?:\s+(?:"([^"]*)"|'([^']*)'))?\s*\)`;

function normalizeSrc(input: string): string {
  const trimmed = input.trim();
  if (trimmed.startsWith("<") && trimmed.endsWith(">")) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function normalizeTitle(input?: string): string | undefined {
  const trimmed = (input ?? "").trim();
  return trimmed ? trimmed : undefined;
}

export function parseMarkdownImageLine(line: string): MarkdownImageLine | null {
  if (!line.startsWith("!")) return null;

  const match = line.match(new RegExp(String.raw`^${IMAGE_PATTERN}\s*$`));
  if (!match) return null;

  const alt = match[1] ?? "";
  const src = normalizeSrc(match[2] ?? "");
  if (!src) return null;

  const title = normalizeTitle(match[3] ?? match[4]);
  return { alt, src, title, raw: line.trim() };
}

export function extractMarkdownImages(markdown: string): MarkdownImage[] {
  const regex = new RegExp(IMAGE_PATTERN, "g");
  const images: MarkdownImage[] = [];

  for (const match of markdown.matchAll(regex)) {
    const alt = match[1] ?? "";
    const src = normalizeSrc(match[2] ?? "");
    if (!src) continue;
    const title = normalizeTitle(match[3] ?? match[4]);
    images.push({ alt, src, title });
  }

  return images;
}

export function extractFirstMarkdownImageUrl(markdown: string): string | undefined {
  return extractMarkdownImages(markdown)[0]?.src;
}

export function stripMarkdownImages(markdown: string): string {
  const regex = new RegExp(IMAGE_PATTERN, "g");

  return markdown
    .replace(regex, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
