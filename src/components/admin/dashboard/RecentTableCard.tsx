"use client";

import { Card, Table } from "antd";
import type { TableColumnsType } from "antd";
import Link from "next/link";

interface RecentTableCardProps<T extends object> {
  title: string;
  viewAllHref: string;
  dataSource: T[];
  columns: TableColumnsType<T>;
  rowKey: string;
}

export function RecentTableCard<T extends object>({
  title,
  viewAllHref,
  dataSource,
  columns,
  rowKey,
}: RecentTableCardProps<T>) {
  return (
    <Card
      title={title}
      extra={<Link href={viewAllHref}>查看全部</Link>}
      styles={{ body: { padding: "8px 20px 4px" } }}
      style={{ borderRadius: 24 }}
    >
      <Table
        dataSource={dataSource}
        columns={columns}
        rowKey={rowKey}
        pagination={false}
        size="small"
        scroll={{ x: 520 }}
      />
    </Card>
  );
}
