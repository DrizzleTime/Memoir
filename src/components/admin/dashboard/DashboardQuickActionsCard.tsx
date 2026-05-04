"use client";

import { Button, Card } from "antd";
import type { DashboardQuickAction } from "@/components/admin/dashboard/types";

interface DashboardQuickActionsCardProps {
  actions: DashboardQuickAction[];
}

export function DashboardQuickActionsCard({ actions }: DashboardQuickActionsCardProps) {
  return (
    <Card
      styles={{ body: { padding: 12 } }}
      style={{ borderRadius: 18, marginBottom: 16 }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(6, minmax(132px, 1fr))",
          gap: 8,
          overflowX: "auto",
          paddingBottom: 2,
        }}
      >
        {actions.map((action) => (
          <Button
            key={action.key}
            type={action.primary ? "primary" : "default"}
            icon={action.icon}
            block
            onClick={action.onClick}
            style={{
              height: 44,
              borderRadius: 12,
              justifyContent: "center",
              paddingInline: 14,
              minWidth: 132,
            }}
          >
            <span
              style={{
                display: "flex",
                alignItems: "center",
                lineHeight: 1,
                textAlign: "center",
                minWidth: 0,
              }}
            >
              <span style={{ fontSize: 14 }}>{action.title}</span>
            </span>
          </Button>
        ))}
      </div>
    </Card>
  );
}
