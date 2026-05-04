import {
  isImageFile,
  isVideoFile,
} from "@/lib/file-meta";

export interface TextSelection {
  start: number;
  end: number;
}

export interface TextEditResult {
  value: string;
  selection: TextSelection;
}

function replaceRange(text: string, selection: TextSelection, replacement: string) {
  return `${text.slice(0, selection.start)}${replacement}${text.slice(selection.end)}`;
}

function getLineRange(text: string, selection: TextSelection) {
  const lineStart = text.lastIndexOf("\n", selection.start - 1) + 1;
  const lineEndIndex = text.indexOf("\n", selection.end);
  const lineEnd = lineEndIndex === -1 ? text.length : lineEndIndex;
  return { lineStart, lineEnd };
}

export function escapeMarkdownText(text: string) {
  return text.replaceAll("\\", "\\\\").replaceAll("[", "\\[").replaceAll("]", "\\]");
}

export function buildInsertText(params: { url: string; name: string; mimeType: string | null; relativePath: string }) {
  const safeName = escapeMarkdownText(params.name.trim() || "file");
  const meta = { mimeType: params.mimeType, relativePath: params.relativePath };
  if (isImageFile(meta)) return `![${safeName}](${params.url})\n`;
  if (isVideoFile(meta)) return `<video src="${params.url}" controls></video>\n`;
  return `[${safeName}](${params.url})\n`;
}

export function insertTextAtSelection(text: string, selection: TextSelection, insertedText: string): TextEditResult {
  const nextValue = replaceRange(text, selection, insertedText);
  const nextPosition = selection.start + insertedText.length;
  return {
    value: nextValue,
    selection: { start: nextPosition, end: nextPosition },
  };
}

export function wrapTextSelection(text: string, selection: TextSelection, prefix: string, suffix?: string): TextEditResult {
  const actualSuffix = suffix ?? prefix;
  const selectedText = text.slice(selection.start, selection.end);
  const replacement = `${prefix}${selectedText}${actualSuffix}`;

  return {
    value: replaceRange(text, selection, replacement),
    selection: {
      start: selection.start + prefix.length,
      end: selection.end + prefix.length,
    },
  };
}

export function prefixSelectedLines(text: string, selection: TextSelection, prefix: string): TextEditResult {
  const { lineStart, lineEnd } = getLineRange(text, selection);
  const segment = text.slice(lineStart, lineEnd);
  const lines = segment.split("\n");
  const replacement = lines.map((line) => `${prefix}${line}`).join("\n");
  const nextValue = `${text.slice(0, lineStart)}${replacement}${text.slice(lineEnd)}`;
  const added = prefix.length * lines.length;

  return {
    value: nextValue,
    selection: {
      start: selection.start + prefix.length,
      end: selection.end + added,
    },
  };
}

export function insertCodeBlock(text: string, selection: TextSelection): TextEditResult {
  const selectedText = text.slice(selection.start, selection.end);
  const block = `\n\`\`\`\n${selectedText}\n\`\`\`\n`;
  const cursor = selection.start + "\n```".length + 1;

  return {
    value: replaceRange(text, selection, block),
    selection: {
      start: cursor,
      end: cursor + selectedText.length,
    },
  };
}

export function insertLink(text: string, selection: TextSelection): TextEditResult {
  const selectedText = text.slice(selection.start, selection.end);
  const url = "https://";

  if (selectedText) {
    const replacement = `[${selectedText}](${url})`;
    const urlStart = selection.start + 1 + selectedText.length + 2;
    return {
      value: replaceRange(text, selection, replacement),
      selection: {
        start: urlStart,
        end: urlStart + url.length,
      },
    };
  }

  return {
    value: replaceRange(text, selection, `[](${url})`),
    selection: {
      start: selection.start + 1,
      end: selection.start + 1,
    },
  };
}
