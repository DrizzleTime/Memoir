"use client";

import { useMemo, useState } from "react";
import hljs from "highlight.js";
import { CopyOutlined, CheckOutlined } from "@ant-design/icons";

function escapeHtml(input: string) {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function getLanguageLabel(language?: string) {
  if (!language) return "Text";
  const normalized = language.toLowerCase();
  if (normalized === "sh" || normalized === "shell") return "Bash";
  return normalized[0].toUpperCase() + normalized.slice(1);
}

interface CodeBlockProps {
  code: string;
  language?: string;
}

export default function CodeBlock({ code, language }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const html = useMemo(() => {
    const trimmed = code.replace(/\n$/, "");
    if (language && hljs.getLanguage(language)) {
      return hljs.highlight(trimmed, { language }).value;
    }
    return escapeHtml(trimmed);
  }, [code, language]);

  const languageLabel = getLanguageLabel(language);

  return (
    <div className="not-prose my-6">
      <div className="group overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
        <div className="flex items-center justify-between gap-3 border-b border-neutral-200 bg-neutral-50 px-3 py-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="inline-flex items-center rounded-md bg-white px-2 py-1 text-[11px] font-semibold text-neutral-600 ring-1 ring-inset ring-neutral-200">
              {languageLabel}
            </span>
            <span className="hidden sm:inline text-xs text-neutral-400 truncate">
              {">_"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {copied ? (
              <span className="hidden sm:inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-200">
                <CheckOutlined />
                已复制
              </span>
            ) : null}
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-md p-2 text-neutral-500 ring-1 ring-inset ring-transparent hover:bg-white hover:text-neutral-800 hover:ring-neutral-200"
              aria-label="复制代码"
              title="复制"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(code.replace(/\n$/, ""));
                  setCopied(true);
                  window.setTimeout(() => setCopied(false), 1500);
                } catch {
                  setCopied(false);
                }
              }}
            >
              <CopyOutlined />
            </button>
          </div>
        </div>

      <pre className="m-0 overflow-x-auto bg-white p-4 text-[13px] leading-relaxed text-neutral-900">
        <code
          className={`hljs${language ? ` language-${language}` : ""}`}
          style={{ background: "transparent" }}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </pre>
      </div>
    </div>
  );
}
