"use client";

import {
  useCallback,
  useEffect,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import {
  Button,
  Card,
  Col,
  DatePicker,
  Form,
  Input,
  Popconfirm,
  Progress,
  Row,
  Space,
  Table,
  Tooltip,
  Typography,
  message,
} from "antd";
import type { TablePaginationConfig } from "antd";
import type { Dayjs } from "dayjs";
import {
  BarChartOutlined,
  DeleteOutlined,
  EyeOutlined,
  ReloadOutlined,
  SearchOutlined,
  TeamOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { useAdminAuth, useAuthFetch } from "@/lib/admin-auth";

interface VisitStats {
  total_pv: number;
  total_uv: number;
  range_pv: number;
  range_uv: number;
  today_pv: number;
  today_uv: number;
}

interface DailyVisitStat {
  date: string;
  pv: number;
  uv: number;
}

interface VisitItem {
  id: number;
  path: string;
  title: string | null;
  referrer: string | null;
  ip_address: string;
  user_agent: string | null;
  device_type: string;
  browser: string;
  os: string;
  country_name: string | null;
  region_name: string | null;
  city_name: string | null;
  visited_at: string;
}

interface TopPageItem {
  path: string;
  title: string | null;
  pv: number;
  uv: number;
  last_visited_at: string | null;
}

interface VisitPageData {
  stats: VisitStats;
  daily_stats: DailyVisitStat[];
  top_pages: TopPageItem[];
  top_referrers: DistributionItem[];
  device_stats: {
    devices: DistributionItem[];
    browsers: DistributionItem[];
    systems: DistributionItem[];
  };
  location_stats: {
    countries: DistributionItem[];
    regions: DistributionItem[];
    cities: DistributionItem[];
  };
  recent_visits: VisitItem[];
  pagination: {
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
  };
}

interface DistributionItem {
  name: string;
  value: number;
}

interface VisitFilterValues {
  dateRange?: [Dayjs, Dayjs] | null;
  q?: string;
  path?: string;
}

interface VisitFilters {
  startDate?: string;
  endDate?: string;
  q?: string;
  path?: string;
  region?: string;
}

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const compactCardStyle: CSSProperties = { borderRadius: 8 };
const compactBodyStyle: CSSProperties = { padding: 16 };
const fullHeightCardStyle: CSSProperties = {
  ...compactCardStyle,
  height: "100%",
  display: "flex",
  flexDirection: "column",
};
const fullHeightBodyStyle: CSSProperties = {
  ...compactBodyStyle,
  flex: 1,
};
const pieColors = ["#111827", "#64748b", "#0f766e", "#b45309", "#7c3aed"];
const otherLocationName = "其他";
const maxLocationLegendItems = 5;

const deviceTypeLabels: Record<string, string> = {
  desktop: "桌面",
  mobile: "手机",
  tablet: "平板",
  unknown: "未知",
};

function formatCompactNumber(value: number) {
  return new Intl.NumberFormat("zh-CN").format(value);
}

function getDisplayTitle(title: string | null, path: string) {
  return title?.trim() || path;
}

function getLocationName(name: string) {
  const trimmedName = name?.trim();
  return trimmedName && trimmedName !== "未知" ? trimmedName : otherLocationName;
}

function buildLocationChartItems(items: DistributionItem[]) {
  const counts = new Map<string, number>();

  items.forEach((item) => {
    const name = getLocationName(item.name);
    counts.set(name, (counts.get(name) || 0) + item.value);
  });

  const realItems = Array.from(counts, ([name, value]) => ({ name, value }))
    .filter((item) => item.name !== otherLocationName)
    .sort((a, b) => b.value - a.value);
  const originalOtherValue = counts.get(otherLocationName) || 0;

  if (originalOtherValue === 0 && realItems.length <= maxLocationLegendItems) {
    return realItems;
  }

  const visibleRealItems = realItems.slice(0, maxLocationLegendItems - 1);
  const hiddenRealValue = realItems
    .slice(maxLocationLegendItems - 1)
    .reduce((sum, item) => sum + item.value, 0);
  const chartItems = [
    ...visibleRealItems,
    { name: otherLocationName, value: originalOtherValue + hiddenRealValue },
  ];

  return chartItems.sort((a, b) => b.value - a.value);
}

function StatTile({
  title,
  value,
  icon,
  note,
}: {
  title: string;
  value: number;
  icon: ReactNode;
  note?: string;
}) {
  return (
    <Card style={compactCardStyle} styles={{ body: compactBodyStyle }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 8,
            display: "grid",
            placeItems: "center",
            background: "#f1f5f9",
            color: "#111827",
            flexShrink: 0,
          }}
        >
          {icon}
        </div>
        <div style={{ minWidth: 0 }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {title}
          </Text>
          <div style={{ fontSize: 26, lineHeight: 1.15, fontWeight: 650 }}>
            {formatCompactNumber(value)}
          </div>
          {note ? (
            <Text type="secondary" style={{ fontSize: 12 }}>
              {note}
            </Text>
          ) : null}
        </div>
      </div>
    </Card>
  );
}

function DailyTrendChart({ items }: { items: DailyVisitStat[] }) {
  const maxValue = Math.max(...items.map((item) => Math.max(item.pv, item.uv)), 1);

  return (
    <div style={{ height: 260, display: "flex", alignItems: "end", gap: 12 }}>
      {items.map((item) => {
        const pvHeight = Math.max((item.pv / maxValue) * 190, item.pv > 0 ? 8 : 2);
        const uvHeight = Math.max((item.uv / maxValue) * 190, item.uv > 0 ? 8 : 2);

        return (
          <Tooltip
            key={item.date}
            title={`${item.date} / PV ${item.pv} / UV ${item.uv}`}
          >
            <div style={{ flex: 1, minWidth: 36 }}>
              <div
                style={{
                  height: 200,
                  display: "flex",
                  alignItems: "end",
                  justifyContent: "center",
                  gap: 4,
                  borderBottom: "1px solid #e5e7eb",
                }}
              >
                <div
                  style={{
                    width: "34%",
                    height: pvHeight,
                    borderRadius: "4px 4px 0 0",
                    background: "#111827",
                  }}
                />
                <div
                  style={{
                    width: "34%",
                    height: uvHeight,
                    borderRadius: "4px 4px 0 0",
                    background: "#94a3b8",
                  }}
                />
              </div>
              <Text
                type="secondary"
                style={{
                  display: "block",
                  marginTop: 8,
                  textAlign: "center",
                  fontSize: 12,
                }}
              >
                {item.date.slice(5)}
              </Text>
            </div>
          </Tooltip>
        );
      })}
    </div>
  );
}

function PageRankChart({ items }: { items: TopPageItem[] }) {
  const maxPv = Math.max(...items.map((item) => item.pv), 1);

  if (items.length === 0) {
    return (
      <div style={{ height: 260 }}>
        <Text type="secondary">暂无页面访问数据</Text>
      </div>
    );
  }

  return (
    <Space orientation="vertical" size={12} style={{ width: "100%", height: 260 }}>
      {items.slice(0, 5).map((item) => (
        <div key={item.path} className="memoir-visit-rank-item">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 12,
              alignItems: "center",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                minWidth: 0,
                flex: 1,
              }}
            >
              <Tooltip title={getDisplayTitle(item.title, item.path)}>
                <Typography.Link
                  href={item.path}
                  target="_blank"
                  rel="noreferrer"
                  ellipsis
                  style={{ minWidth: 0 }}
                >
                  {getDisplayTitle(item.title, item.path)}
                </Typography.Link>
              </Tooltip>
              {item.title ? (
                <Tooltip title={item.path}>
                  <Text
                    code
                    type="secondary"
                    ellipsis
                    className="memoir-visit-rank-path"
                  >
                    {item.path}
                  </Text>
                </Tooltip>
              ) : null}
            </div>
            <Tooltip title={item.path}>
              <Text strong style={{ flexShrink: 0 }}>
                {item.pv} PV / {item.uv} UV
              </Text>
            </Tooltip>
          </div>
          <Progress
            percent={Math.round((item.pv / maxPv) * 100)}
            showInfo={false}
            strokeColor="#111827"
            railColor="#e5e7eb"
            size="small"
          />
        </div>
      ))}
    </Space>
  );
}

function DistributionBars({ items }: { items: DistributionItem[] }) {
  const maxValue = Math.max(...items.map((item) => item.value), 1);

  if (items.length === 0) {
    return <Text type="secondary">暂无数据</Text>;
  }

  return (
    <Space orientation="vertical" size={10} style={{ width: "100%" }}>
      {items.slice(0, 5).map((item, index) => (
        <div key={`${item.name}-${index}`}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
            <Text ellipsis style={{ maxWidth: 180 }}>
              {item.name || "unknown"}
            </Text>
            <Text strong>{item.value}</Text>
          </div>
          <Progress
            percent={Math.round((item.value / maxValue) * 100)}
            showInfo={false}
            strokeColor={pieColors[index % pieColors.length]}
            railColor="#e5e7eb"
            size="small"
          />
        </div>
      ))}
    </Space>
  );
}

function ReferrerRankChart({ items }: { items: DistributionItem[] }) {
  const maxValue = Math.max(...items.map((item) => item.value), 1);

  if (items.length === 0) {
    return <Text type="secondary">暂无来源数据</Text>;
  }

  return (
    <Space orientation="vertical" size={10} style={{ width: "100%" }}>
      {items.map((item, index) => (
        <div key={`${item.name}-${index}`}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
            <Tooltip title={item.name}>
              <Text ellipsis style={{ maxWidth: 180 }}>
                {item.name}
              </Text>
            </Tooltip>
            <Text strong>{item.value} PV</Text>
          </div>
          <Progress
            percent={Math.round((item.value / maxValue) * 100)}
            showInfo={false}
            strokeColor={pieColors[index % pieColors.length]}
            railColor="#e5e7eb"
            size="small"
          />
        </div>
      ))}
    </Space>
  );
}

function DevicePieChart({ items }: { items: DistributionItem[] }) {
  const total = items.reduce((sum, item) => sum + item.value, 0);
  let currentPercent = 0;
  const gradient = total
    ? items
        .map((item, index) => {
          const start = currentPercent;
          const end = currentPercent + (item.value / total) * 100;
          currentPercent = end;
          return `${pieColors[index % pieColors.length]} ${start}% ${end}%`;
        })
        .join(", ")
    : "#e5e7eb 0% 100%";

  return (
    <div style={{ display: "grid", gridTemplateColumns: "160px 1fr", gap: 18, alignItems: "center" }}>
      <div
        style={{
          width: 154,
          height: 154,
          borderRadius: "50%",
          background: `conic-gradient(${gradient})`,
          display: "grid",
          placeItems: "center",
        }}
      >
        <div
          style={{
            width: 86,
            height: 86,
            borderRadius: "50%",
            background: "#fff",
            display: "grid",
            placeItems: "center",
            textAlign: "center",
          }}
        >
          <div>
            <div style={{ fontSize: 24, lineHeight: 1, fontWeight: 650 }}>{total}</div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              PV
            </Text>
          </div>
        </div>
      </div>
      <Space orientation="vertical" size={8} style={{ width: "100%" }}>
        {items.length === 0 ? (
          <Text type="secondary">暂无设备数据</Text>
        ) : (
          items.map((item, index) => (
            <div
              key={`${item.name}-${index}`}
              style={{ display: "flex", justifyContent: "space-between", gap: 12 }}
            >
              <Space size={8}>
                <span
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 999,
                    background: pieColors[index % pieColors.length],
                    display: "inline-block",
                  }}
                />
                <Text>{deviceTypeLabels[item.name] || item.name || "未知"}</Text>
              </Space>
              <Text strong>
                {item.value}
                {total ? ` (${Math.round((item.value / total) * 100)}%)` : ""}
              </Text>
            </div>
          ))
        )}
      </Space>
    </div>
  );
}

function LocationPieChart({
  items,
  emptyText,
  selectedName,
  onSelect,
}: {
  items: DistributionItem[];
  emptyText: string;
  selectedName?: string | null;
  onSelect?: (name: string) => void;
}) {
  const total = items.reduce((sum, item) => sum + item.value, 0);
  let currentPercent = 0;
  const chartItems = buildLocationChartItems(items);
  const gradient = total
    ? chartItems
        .map((item, index) => {
          const start = currentPercent;
          const end = currentPercent + (item.value / total) * 100;
          currentPercent = end;
          return `${pieColors[index % pieColors.length]} ${start}% ${end}%`;
        })
        .join(", ")
    : "#e5e7eb 0% 100%";

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "150px 1fr",
        gap: 18,
        alignItems: "center",
        height: "100%",
        minHeight: 188,
      }}
    >
      <div
        style={{
          width: 144,
          height: 144,
          borderRadius: "50%",
          background: `conic-gradient(${gradient})`,
          display: "grid",
          placeItems: "center",
        }}
      >
        <div
          style={{
            width: 78,
            height: 78,
            borderRadius: "50%",
            background: "#fff",
            display: "grid",
            placeItems: "center",
            textAlign: "center",
          }}
        >
          <div>
            <div style={{ fontSize: 22, lineHeight: 1, fontWeight: 650 }}>{total}</div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              PV
            </Text>
          </div>
        </div>
      </div>
      <Space orientation="vertical" size={8} style={{ width: "100%" }}>
        {chartItems.length === 0 ? (
          <Text type="secondary">{emptyText}</Text>
        ) : (
          chartItems.map((item, index) => {
            const isSelected = selectedName === item.name;
            const canSelect = Boolean(onSelect) && item.name !== otherLocationName;

            return (
              <button
                key={`${item.name}-${index}`}
                type="button"
                onClick={() => {
                  if (canSelect) {
                    onSelect?.(item.name);
                  }
                }}
                disabled={!canSelect}
                style={{
                  width: "100%",
                  border: 0,
                  padding: "4px 6px",
                  borderRadius: 6,
                  background: isSelected ? "#f1f5f9" : "transparent",
                  cursor: canSelect ? "pointer" : "default",
                  textAlign: "left",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 12,
                    alignItems: "center",
                  }}
                >
                  <Space size={8} style={{ minWidth: 0 }}>
                    <span
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: 999,
                        background: pieColors[index % pieColors.length],
                        display: "inline-block",
                        flexShrink: 0,
                      }}
                    />
                    <Text ellipsis style={{ maxWidth: 130 }}>
                      {item.name}
                    </Text>
                  </Space>
                  <Text strong style={{ flexShrink: 0 }}>
                    {item.value}
                    {total ? ` (${Math.round((item.value / total) * 100)}%)` : ""}
                  </Text>
                </div>
              </button>
            );
          })
        )}
      </Space>
    </div>
  );
}

export default function AdminVisitsPage() {
  const [data, setData] = useState<VisitPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });
  const [clearBeforeDate, setClearBeforeDate] = useState<Dayjs | null>(null);
  const [clearing, setClearing] = useState(false);
  const [filters, setFilters] = useState<VisitFilters>({});
  const { token } = useAdminAuth();
  const authFetch = useAuthFetch();
  const [messageApi, contextHolder] = message.useMessage();
  const [form] = Form.useForm<VisitFilterValues>();

  const fetchVisits = useCallback(async (
    page = 1,
    pageSize = 20,
    nextFilters: VisitFilters = {}
  ) => {
    if (!token) return;

    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        page_size: String(pageSize),
      });
      if (nextFilters.startDate) {
        params.set("start_date", nextFilters.startDate);
      }
      if (nextFilters.endDate) {
        params.set("end_date", nextFilters.endDate);
      }
      if (nextFilters.q) {
        params.set("q", nextFilters.q);
      }
      if (nextFilters.path) {
        params.set("path", nextFilters.path);
      }
      if (nextFilters.region) {
        params.set("region", nextFilters.region);
      }

      const response = await authFetch(`/api/admin/visits?${params.toString()}`);
      if (!response.ok) {
        throw new Error("获取访问统计失败");
      }

      const result: VisitPageData = await response.json();
      setData(result);
      setFilters(nextFilters);
      setPagination({
        current: result.pagination.page,
        pageSize: result.pagination.page_size,
        total: result.pagination.total,
      });
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : "获取访问统计失败");
    } finally {
      setLoading(false);
    }
  }, [authFetch, messageApi, token]);

  useEffect(() => {
    if (token) {
      void fetchVisits();
    }
  }, [fetchVisits, token]);

  const handleTableChange = (paginationConfig: TablePaginationConfig) => {
    void fetchVisits(
      paginationConfig.current || 1,
      paginationConfig.pageSize || 20,
      filters
    );
  };

  const handleSearch = (values: VisitFilterValues) => {
    const nextFilters = {
      startDate: values.dateRange?.[0]?.format("YYYY-MM-DD"),
      endDate: values.dateRange?.[1]?.format("YYYY-MM-DD"),
      q: values.q?.trim() || undefined,
      path: values.path?.trim() || undefined,
      region: filters.region,
    };

    void fetchVisits(1, pagination.pageSize, nextFilters);
  };

  const handleReset = () => {
    const nextFilters = {};
    form.resetFields();
    void fetchVisits(1, pagination.pageSize, nextFilters);
  };

  const handleRegionSelect = (region: string) => {
    const nextRegion = filters.region === region ? undefined : region;
    void fetchVisits(1, pagination.pageSize, {
      ...filters,
      region: nextRegion,
    });
  };

  const clearVisits = async (payload: { mode: "all" } | { mode: "before_date"; before_date: string }) => {
    if (!token) return;

    setClearing(true);
    try {
      const response = await authFetch("/api/admin/visits", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.detail || "清理统计数据失败");
      }

      messageApi.success(result.message || "统计数据已清理");
      void fetchVisits(1, pagination.pageSize, filters);
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : "清理统计数据失败");
    } finally {
      setClearing(false);
    }
  };

  const stats = data?.stats;

  return (
    <>
      {contextHolder}
      <Space orientation="vertical" size={12} style={{ width: "100%" }}>
        <div
          style={{
            display: "flex",
            alignItems: "end",
            justifyContent: "space-between",
            gap: 16,
          }}
        >
          <div>
            <Title level={2} style={{ margin: 0 }}>
              访问统计
            </Title>
            <Text type="secondary">只统计前台页面访问，不包含后台和接口请求。</Text>
          </div>
          <Text type="secondary">
            全站累计：PV {formatCompactNumber(stats?.total_pv || 0)} / UV{" "}
            {formatCompactNumber(stats?.total_uv || 0)}
          </Text>
        </div>

        <Card style={compactCardStyle} styles={{ body: { padding: 12 } }}>
          <Row gutter={12} align="middle">
            <Col flex="auto">
              <Form
                form={form}
                onFinish={handleSearch}
              >
                <Row gutter={12} align="bottom">
                  <Col xs={24} md={9} xl={7}>
                    <Form.Item name="dateRange" style={{ marginBottom: 0 }}>
                      <RangePicker
                        placeholder={["开始日期", "结束日期"]}
                        style={{ width: "100%" }}
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={7} xl={6}>
                    <Form.Item name="q" style={{ marginBottom: 0 }}>
                      <Input
                        allowClear
                        placeholder="标题 / 路径 / IP / UA / 来源"
                        prefix={<SearchOutlined />}
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={5} xl={6}>
                    <Form.Item name="path" style={{ marginBottom: 0 }}>
                      <Input allowClear placeholder="/article/1" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={3} xl={5}>
                    <Form.Item style={{ marginBottom: 0 }}>
                      <Space>
                        <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
                          筛选
                        </Button>
                        <Button icon={<ReloadOutlined />} onClick={handleReset}>
                          重置
                        </Button>
                      </Space>
                    </Form.Item>
                  </Col>
                </Row>
              </Form>
            </Col>
            <Col>
              <Space>
                <DatePicker
                  placeholder="清理此日期前"
                  value={clearBeforeDate}
                  onChange={setClearBeforeDate}
                  style={{ width: 150 }}
                />
                <Popconfirm
                  title="确认清理旧统计？"
                  description="会删除所选日期 00:00 之前的访问统计数据。"
                  okText="清理"
                  cancelText="取消"
                  disabled={!clearBeforeDate}
                  onConfirm={() => {
                    if (!clearBeforeDate) return;
                    void clearVisits({
                      mode: "before_date",
                      before_date: clearBeforeDate.format("YYYY-MM-DD"),
                    });
                  }}
                >
                  <Button
                    icon={<DeleteOutlined />}
                    loading={clearing}
                    disabled={!clearBeforeDate}
                  >
                    清理旧数据
                  </Button>
                </Popconfirm>
                <Popconfirm
                  title="确认清空全部统计？"
                  description="这个操作会删除所有访问统计数据，不能撤销。"
                  okText="清空"
                  cancelText="取消"
                  okButtonProps={{ danger: true }}
                  onConfirm={() => void clearVisits({ mode: "all" })}
                >
                  <Button danger icon={<DeleteOutlined />} loading={clearing}>
                    清空全部
                  </Button>
                </Popconfirm>
              </Space>
            </Col>
          </Row>
        </Card>

        <Row gutter={[12, 12]}>
          <Col xs={24} sm={12} xl={6}>
            <StatTile
              title="范围 PV"
              value={stats?.range_pv || 0}
              icon={<EyeOutlined />}
              note="筛选条件内访问次数"
            />
          </Col>
          <Col xs={24} sm={12} xl={6}>
            <StatTile
              title="范围 UV"
              value={stats?.range_uv || 0}
              icon={<TeamOutlined />}
              note="按 IP + UA 去重"
            />
          </Col>
          <Col xs={24} sm={12} xl={6}>
            <StatTile
              title="今日 PV"
              value={stats?.today_pv || 0}
              icon={<BarChartOutlined />}
              note="服务端本地日期"
            />
          </Col>
          <Col xs={24} sm={12} xl={6}>
            <StatTile
              title="今日 UV"
              value={stats?.today_uv || 0}
              icon={<UserOutlined />}
              note="今日独立访客"
            />
          </Col>
        </Row>

        <Row gutter={[12, 12]}>
          <Col xs={24} xl={14}>
            <Card
              title="PV / UV 趋势"
              extra={
                <Space size={12}>
                  <Text type="secondary"><span style={{ color: "#111827" }}>■</span> PV</Text>
                  <Text type="secondary"><span style={{ color: "#94a3b8" }}>■</span> UV</Text>
                </Space>
              }
              loading={loading}
              style={compactCardStyle}
              styles={{ body: compactBodyStyle }}
            >
              <DailyTrendChart items={data?.daily_stats || []} />
            </Card>
          </Col>
          <Col xs={24} xl={10}>
            <Card
              title="页面访问排行"
              loading={loading}
              style={compactCardStyle}
              styles={{ body: compactBodyStyle }}
            >
              <PageRankChart items={data?.top_pages || []} />
            </Card>
          </Col>
        </Row>

        <Row gutter={[12, 12]}>
          <Col xs={24} xl={10}>
            <Card
              title="设备类型"
              loading={loading}
              style={fullHeightCardStyle}
              styles={{ body: fullHeightBodyStyle }}
            >
              <DevicePieChart items={data?.device_stats.devices || []} />
            </Card>
          </Col>
          <Col xs={24} md={12} xl={7}>
            <Card
              title="浏览器"
              loading={loading}
              style={fullHeightCardStyle}
              styles={{ body: fullHeightBodyStyle }}
            >
              <DistributionBars items={data?.device_stats.browsers || []} />
            </Card>
          </Col>
          <Col xs={24} md={12} xl={7}>
            <Card
              title="系统"
              loading={loading}
              style={fullHeightCardStyle}
              styles={{ body: fullHeightBodyStyle }}
            >
              <DistributionBars items={data?.device_stats.systems || []} />
            </Card>
          </Col>
        </Row>

        <Row gutter={[12, 12]}>
          <Col xs={24} xl={8}>
            <Card
              title="国家占比"
              loading={loading}
              style={fullHeightCardStyle}
              styles={{ body: fullHeightBodyStyle }}
            >
              <LocationPieChart
                items={data?.location_stats.countries || []}
                emptyText="暂无国家数据"
              />
            </Card>
          </Col>
          <Col xs={24} xl={8}>
            <Card
              title="省份占比"
              loading={loading}
              style={fullHeightCardStyle}
              styles={{ body: fullHeightBodyStyle }}
            >
              <LocationPieChart
                items={data?.location_stats.regions || []}
                emptyText="暂无省份数据"
                selectedName={filters.region}
                onSelect={handleRegionSelect}
              />
            </Card>
          </Col>
          <Col xs={24} xl={8}>
            <Card
              title="来源排行"
              loading={loading}
              style={fullHeightCardStyle}
              styles={{ body: fullHeightBodyStyle }}
            >
              <ReferrerRankChart items={data?.top_referrers || []} />
            </Card>
          </Col>
        </Row>

        <Card
          title="访问明细"
          style={compactCardStyle}
          styles={{ body: compactBodyStyle }}
        >
          <Table
            rowKey="id"
            loading={loading}
            dataSource={data?.recent_visits || []}
            scroll={{ x: 1260 }}
            pagination={{
              current: pagination.current,
              pageSize: pagination.pageSize,
              total: pagination.total,
              showSizeChanger: true,
            }}
            onChange={handleTableChange}
            columns={[
              {
                title: "路径",
                dataIndex: "path",
                key: "path",
                ellipsis: true,
                render: (path: string) => (
                  <Tooltip title={path}>
                    <Typography.Link href={path} target="_blank" rel="noreferrer">
                      <Text code>{path}</Text>
                    </Typography.Link>
                  </Tooltip>
                ),
              },
              {
                title: "IP",
                dataIndex: "ip_address",
                key: "ip_address",
                width: 160,
              },
              {
                title: "地区",
                key: "location",
                width: 180,
                render: (_: unknown, record: VisitItem) => {
                  const location = [
                    record.country_name,
                    record.region_name,
                    record.city_name,
                  ].filter(Boolean).join(" / ");

                  return location || "未知";
                },
              },
              {
                title: "设备",
                key: "device",
                width: 170,
                render: (_: unknown, record: VisitItem) => (
                  <Space size={4} orientation="vertical">
                    <Text>{deviceTypeLabels[record.device_type] || record.device_type}</Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {record.browser} / {record.os}
                    </Text>
                  </Space>
                ),
              },
              {
                title: "来源",
                dataIndex: "referrer",
                key: "referrer",
                width: 220,
                ellipsis: true,
                render: (referrer: string | null) =>
                  referrer ? (
                    <Tooltip title={referrer}>{referrer}</Tooltip>
                  ) : (
                    "-"
                  ),
              },
              {
                title: "User-Agent",
                dataIndex: "user_agent",
                key: "user_agent",
                width: 260,
                ellipsis: true,
                render: (userAgent: string | null) =>
                  userAgent ? (
                    <Tooltip title={userAgent}>{userAgent}</Tooltip>
                  ) : (
                    "-"
                  ),
              },
              {
                title: "访问时间",
                dataIndex: "visited_at",
                key: "visited_at",
                width: 180,
                render: (date: string) => new Date(date).toLocaleString("zh-CN"),
              },
            ]}
          />
        </Card>
      </Space>
    </>
  );
}
