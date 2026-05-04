"use client";

import { Card, Col, Row, Tag, Typography } from "antd";
import type { DashboardStatItem } from "@/components/admin/dashboard/types";

const { Text } = Typography;

const statCardBodyStyle = {
  padding: 20,
};

const statValueStyle = {
  fontSize: 36,
  lineHeight: 1,
  fontWeight: 600,
  color: "#0f172a",
};

interface DashboardStatsGridProps {
  items: DashboardStatItem[];
}

export function DashboardStatsGrid({ items }: DashboardStatsGridProps) {
  return (
    <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
      {items.map((item) => (
        <Col key={item.key} xs={24} sm={12} lg={8} xl={8}>
          <Card styles={{ body: statCardBodyStyle }} style={{ borderRadius: 24 }}>
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: 16,
              }}
            >
              <div>
                <Text style={{ color: "#64748b", fontSize: 13 }}>{item.title}</Text>
                <div style={{ ...statValueStyle, color: item.accent, marginTop: 10 }}>
                  {item.value}
                </div>
              </div>
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 14,
                  display: "grid",
                  placeItems: "center",
                  background: "#f8fafc",
                  color: item.accent,
                  flexShrink: 0,
                }}
              >
                {item.icon}
              </div>
            </div>
            <div style={{ marginTop: 16, display: "flex", gap: 8, flexWrap: "wrap" }}>
              <Tag
                variant="filled"
                color={item.metaTagColor}
                style={{ margin: 0, borderRadius: 999, paddingInline: 10 }}
              >
                {item.meta}
              </Tag>
              {item.extraMeta ? (
                <Tag
                  variant="filled"
                  color="warning"
                  style={{ margin: 0, borderRadius: 999, paddingInline: 10 }}
                >
                  {item.extraMeta}
                </Tag>
              ) : null}
            </div>
          </Card>
        </Col>
      ))}
    </Row>
  );
}
