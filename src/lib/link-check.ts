import { isBlockedHost, normalizeHttpUrl } from "@/lib/url-safety";

export type LinkCheckStatus = "valid" | "invalid";

export interface LinkCheckTarget {
  id: number;
  name: string;
  url: string;
  isActive: boolean;
}

export interface LinkCheckResult extends LinkCheckTarget {
  status: LinkCheckStatus;
  httpStatus: number | null;
  reason: string;
  checkedAt: string;
}

const USER_AGENT =
  "Mozilla/5.0 (compatible; MemoirLinkChecker/1.0; +https://localhost)";
const REQUEST_TIMEOUT_MS = 8000;
const CHECK_CONCURRENCY = 5;

export async function checkLinks(
  targets: LinkCheckTarget[]
): Promise<LinkCheckResult[]> {
  if (targets.length === 0) {
    return [];
  }

  const results = new Array<LinkCheckResult>(targets.length);
  let nextIndex = 0;

  const workers = Array.from(
    { length: Math.min(CHECK_CONCURRENCY, targets.length) },
    async () => {
      while (true) {
        const currentIndex = nextIndex;
        nextIndex += 1;
        if (currentIndex >= targets.length) {
          break;
        }

        results[currentIndex] = await checkLink(targets[currentIndex]);
      }
    }
  );

  await Promise.all(workers);
  return results;
}

async function checkLink(target: LinkCheckTarget): Promise<LinkCheckResult> {
  const checkedAt = new Date().toISOString();

  try {
    const normalizedUrl = normalizeHttpUrl(target.url);
    const url = new URL(normalizedUrl);

    if (isBlockedHost(url.hostname)) {
      return createInvalidResult(target, checkedAt, "私有地址不支持检测");
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(normalizedUrl, {
        method: "GET",
        redirect: "follow",
        cache: "no-store",
        signal: controller.signal,
        headers: {
          "user-agent": USER_AGENT,
          accept: "text/html,application/xhtml+xml,*/*;q=0.8",
        },
      });

      try {
        await response.body?.cancel();
      } catch {
        // 忽略取消响应体失败，不影响检测结果。
      }

      if (response.ok) {
        return {
          ...target,
          status: "valid",
          httpStatus: response.status,
          reason: `HTTP ${response.status}`,
          checkedAt,
        };
      }

      return createInvalidResult(
        target,
        checkedAt,
        `HTTP ${response.status}`,
        response.status
      );
    } catch (error) {
      return createInvalidResult(target, checkedAt, getErrorReason(error));
    } finally {
      clearTimeout(timer);
    }
  } catch (error) {
    return createInvalidResult(target, checkedAt, getErrorReason(error));
  }
}

function createInvalidResult(
  target: LinkCheckTarget,
  checkedAt: string,
  reason: string,
  httpStatus: number | null = null
): LinkCheckResult {
  return {
    ...target,
    status: "invalid",
    httpStatus,
    reason,
    checkedAt,
  };
}

function getErrorReason(error: unknown): string {
  if (error instanceof Error) {
    if (error.name === "AbortError") {
      return "请求超时";
    }

    const message = error.message.toLowerCase();
    if (message.includes("enotfound") || message.includes("getaddrinfo")) {
      return "域名解析失败";
    }
    if (message.includes("econnrefused")) {
      return "连接被拒绝";
    }
    if (message.includes("certificate")) {
      return "证书校验失败";
    }
    if (message.includes("timeout")) {
      return "请求超时";
    }

    return error.message || "检测失败";
  }

  return "检测失败";
}
