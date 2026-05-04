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

export function getStandaloneUrlFromParagraph(node: unknown): string | null {
  if (!node || typeof node !== "object") return null;

  const children = (node as { children?: unknown[] }).children;
  if (!Array.isArray(children)) return null;

  const meaningful = children.filter(isMeaningfulChild);
  if (meaningful.length !== 1) return null;

  const only = meaningful[0];
  if (!isElementNode(only) || only.tagName !== "a") return null;

  const href = only.properties?.href;
  if (typeof href !== "string") return null;
  if (!href.startsWith("http://") && !href.startsWith("https://")) return null;

  const linkChildren = Array.isArray(only.children) ? only.children : [];
  const text = linkChildren
    .filter(isTextNode)
    .map((child) => child.value)
    .join("")
    .trim();

  if (!text || text !== href) return null;
  return href;
}

