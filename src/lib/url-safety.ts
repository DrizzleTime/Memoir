function isPrivateIpv4(hostname: string): boolean {
  if (!/^\d{1,3}(\.\d{1,3}){3}$/.test(hostname)) return false;
  const parts = hostname.split(".").map((part) => Number(part));
  if (parts.some((n) => Number.isNaN(n) || n < 0 || n > 255)) return false;

  if (parts[0] === 10) return true;
  if (parts[0] === 127) return true;
  if (parts[0] === 192 && parts[1] === 168) return true;
  if (parts[0] === 169 && parts[1] === 254) return true;
  if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
  return false;
}

function isPrivateIpv6(hostname: string): boolean {
  if (!hostname.includes(":")) return false;
  const compact = hostname.replace(/:/g, "").toLowerCase();
  if (compact.startsWith("fc") || compact.startsWith("fd")) return true;
  if (compact.startsWith("fe80")) return true;
  return false;
}

export function normalizeHttpUrl(input: string): string {
  const url = new URL(input);
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("只支持 http/https 链接");
  }
  url.hash = "";
  return url.toString();
}

export function isBlockedHost(hostname: string): boolean {
  const lower = hostname.toLowerCase();
  if (lower === "localhost" || lower.endsWith(".localhost")) return true;
  if (lower === "127.0.0.1" || lower === "::1") return true;

  if (isPrivateIpv4(lower)) return true;
  if (isPrivateIpv6(lower)) return true;
  return false;
}
