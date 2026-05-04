export default function remarkHtmlRender() {
  return (tree: unknown) => {
    traverse(tree);
  };
}

function traverse(node: unknown) {
  if (!node || typeof node !== "object") return;

  const maybeNode = node as { children?: unknown[] };
  const children = maybeNode.children;
  if (!Array.isArray(children)) return;

  for (let index = 0; index < children.length; index++) {
    const child = children[index];
    if (isCodeNode(child)) {
      const lang = child.lang?.toLowerCase() ?? "";
      const meta = child.meta ?? "";
      const shouldRender =
        lang === "html" && meta.split(/\s+/).includes("render");

      if (shouldRender) {
        children[index] = { type: "html", value: child.value ?? "" };
        continue;
      }
    }

    traverse(child);
  }
}

function isCodeNode(
  node: unknown
): node is { type: "code"; lang?: string; meta?: string; value?: string } {
  if (!node || typeof node !== "object") return false;
  const maybeNode = node as Record<string, unknown>;
  if (maybeNode.type !== "code") return false;

  const lang = maybeNode.lang;
  if (lang !== undefined && typeof lang !== "string") return false;

  const meta = maybeNode.meta;
  if (meta !== undefined && typeof meta !== "string") return false;

  const value = maybeNode.value;
  if (value !== undefined && typeof value !== "string") return false;

  return true;
}
