import type { LinkCheckResult } from "@/lib/link-check";

export interface LinkItem {
  id: number;
  name: string;
  url: string;
  avatarUrl: string | null;
  category: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LinkCheckSummary {
  scannedAt: string;
  total: number;
  validCount: number;
  invalidCount: number;
  activeInvalidCount: number;
}

export interface LinkCheckResponse extends LinkCheckSummary {
  items: LinkCheckResult[];
}

export interface LinkFormValues {
  name: string;
  url: string;
  avatarUrl?: string;
  category: string;
  sortOrder: number;
  isActive: boolean;
}
