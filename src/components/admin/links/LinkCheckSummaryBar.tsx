"use client";

import { Typography } from "antd";
import type { LinkCheckSummary } from "@/components/admin/links/types";

const { Text } = Typography;

interface LinkCheckSummaryBarProps {
  summary: LinkCheckSummary | null;
}

export function LinkCheckSummaryBar({ summary }: LinkCheckSummaryBarProps) {
  if (!summary) {
    return null;
  }

  return (
    <div style={{ marginBottom: 16 }}>
      <Text type="secondary">
        上次检测：{new Date(summary.scannedAt).toLocaleString("zh-CN")}，共{" "}
        {summary.total} 条，正常 {summary.validCount} 条，失效{" "}
        {summary.invalidCount} 条，待关闭 {summary.activeInvalidCount} 条
      </Text>
    </div>
  );
}
