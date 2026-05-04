"use client";

import { Button, Typography } from "antd";
import { ArrowRightOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;

interface AdminDashboardHeaderProps {
  onManageArticles: () => void;
}

export function AdminDashboardHeader({ onManageArticles }: AdminDashboardHeaderProps) {
  return (
    <section style={{ marginBottom: 24 }}>
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <div>
          <Title level={3} style={{ margin: 0, fontSize: 32 }}>
            仪表盘
          </Title>
          <Text style={{ color: "#64748b" }}>常用操作与内容概况</Text>
        </div>
        <Button
          type="default"
          icon={<ArrowRightOutlined />}
          iconPlacement="end"
          onClick={onManageArticles}
          style={{ borderRadius: 999, height: 40, paddingInline: 18 }}
        >
          进入文章管理
        </Button>
      </div>
    </section>
  );
}
