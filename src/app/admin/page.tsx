"use client";

import { useEffect, useRef, useState } from "react";
import { Col, Row, Spin, Tag, message } from "antd";
import type { TableColumnsType } from "antd";
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CommentOutlined,
  EditOutlined,
  FileTextOutlined,
  FolderOutlined,
  MessageOutlined,
  PlusOutlined,
  SettingOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { AdminDashboardHeader } from "@/components/admin/dashboard/AdminDashboardHeader";
import { DashboardQuickActionsCard } from "@/components/admin/dashboard/DashboardQuickActionsCard";
import { DashboardStatsGrid } from "@/components/admin/dashboard/DashboardStatsGrid";
import { RecentTableCard } from "@/components/admin/dashboard/RecentTableCard";
import type {
  DashboardData,
  DashboardQuickAction,
  DashboardStatItem,
  RecentArticle,
  RecentComment,
  RecentFile,
  RecentMemo,
} from "@/components/admin/dashboard/types";
import { useAdminAuth, useAuthFetch } from "@/lib/admin-auth";
import { ARTICLE_STATUS_LABELS, ARTICLE_STATUS_TAG_COLORS } from "@/lib/article-status";
import { formatBytes } from "@/lib/format-bytes";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ArticleStatus } from "@/lib/article-status";

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const { token } = useAdminAuth();
  const authFetch = useAuthFetch();
  const [messageApi, contextHolder] = message.useMessage();
  const hasFetched = useRef(false);
  const router = useRouter();

  useEffect(() => {
    if (!token || hasFetched.current) return;
    hasFetched.current = true;

    const fetchStats = async () => {
      try {
        const response = await authFetch("/api/admin/stats");
        if (!response.ok) {
          throw new Error("获取统计数据失败");
        }
        const result = await response.json();
        setData(result);
      } catch (error) {
        messageApi.error(error instanceof Error ? error.message : "获取数据失败");
      } finally {
        setLoading(false);
      }
    };

    void fetchStats();
  }, [authFetch, messageApi, token]);

  if (loading) {
    return (
      <>
        {contextHolder}
        <div style={{ textAlign: "center", padding: 80 }}>
          <Spin size="large" />
        </div>
      </>
    );
  }

  const stats = data?.stats;

  const statItems: DashboardStatItem[] = [
    {
      key: "articles",
      title: "文章",
      value: stats?.total_articles || 0,
      icon: <FileTextOutlined style={{ fontSize: 18 }} />,
      accent: "#111827",
      meta: `${stats?.published_articles || 0} 已发布 / ${stats?.draft_articles || 0} 草稿 / ${stats?.private_articles || 0} 私密`,
    },
    {
      key: "comments",
      title: "评论",
      value: stats?.total_comments || 0,
      icon: <CommentOutlined style={{ fontSize: 18 }} />,
      accent: "#0f172a",
      meta: `${stats?.pending_comments || 0} 待审核`,
      metaTagColor: (stats?.pending_comments || 0) > 0 ? "warning" : "default",
    },
    {
      key: "files",
      title: "文件",
      value: stats?.total_files || 0,
      icon: <FolderOutlined style={{ fontSize: 18 }} />,
      accent: "#0f172a",
      meta: formatBytes(stats?.total_file_size || 0),
      extraMeta: (stats?.missing_files || 0) > 0 ? `${stats?.missing_files} 缺失` : null,
    },
    {
      key: "memos",
      title: "动态",
      value: stats?.total_memos || 0,
      icon: <MessageOutlined style={{ fontSize: 18 }} />,
      accent: "#0f172a",
      meta: `${stats?.published_memos || 0} 已发布 / ${stats?.draft_memos || 0} 草稿`,
    },
    {
      key: "published",
      title: "已发布文章",
      value: stats?.published_articles || 0,
      icon: <CheckCircleOutlined style={{ fontSize: 18 }} />,
      accent: "#16a34a",
      meta: "当前线上可见内容",
    },
    {
      key: "users",
      title: "用户",
      value: stats?.total_users || 0,
      icon: <UserOutlined style={{ fontSize: 18 }} />,
      accent: "#0f172a",
      meta: "后台账户总数",
    },
  ];

  const quickActions: DashboardQuickAction[] = [
    {
      key: "create-article",
      title: "新建文章",
      icon: <PlusOutlined />,
      primary: true,
      onClick: () => router.push("/admin/articles/create"),
    },
    {
      key: "publish-memo",
      title: "发布动态",
      icon: <MessageOutlined />,
      onClick: () => router.push("/admin/memos"),
    },
    {
      key: "review-comments",
      title: "审核评论",
      icon: <CommentOutlined />,
      onClick: () => router.push("/admin/comments"),
    },
    {
      key: "upload-files",
      title: "上传文件",
      icon: <FolderOutlined />,
      onClick: () => router.push("/admin/files"),
    },
    {
      key: "manage-articles",
      title: "文章管理",
      icon: <FileTextOutlined />,
      onClick: () => router.push("/admin/articles"),
    },
    {
      key: "settings",
      title: "系统配置",
      icon: <SettingOutlined />,
      onClick: () => router.push("/admin/settings"),
    },
  ];

  const articleColumns: TableColumnsType<RecentArticle> = [
    {
      title: "标题",
      dataIndex: "title",
      key: "title",
      render: (text: string, record: RecentArticle) => (
        <Link href={`/admin/articles/${record.id}`}>{text}</Link>
      ),
    },
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      width: 100,
      render: (status: ArticleStatus) => (
        <Tag
          icon={status === "PUBLISHED" ? <CheckCircleOutlined /> : <EditOutlined />}
          color={ARTICLE_STATUS_TAG_COLORS[status]}
        >
          {ARTICLE_STATUS_LABELS[status]}
        </Tag>
      ),
    },
    {
      title: "作者",
      dataIndex: "author",
      key: "author",
      width: 120,
      render: (author: RecentArticle["author"]) => author.nickname || author.username,
    },
    {
      title: "创建时间",
      dataIndex: "created_at",
      key: "created_at",
      width: 180,
      render: (date: string) => new Date(date).toLocaleString("zh-CN"),
    },
  ];

  const commentColumns: TableColumnsType<RecentComment> = [
    {
      title: "内容",
      dataIndex: "content",
      key: "content",
      ellipsis: true,
    },
    {
      title: "目标",
      key: "target",
      width: 200,
      ellipsis: true,
      render: (_: unknown, record: RecentComment) => (
        record.article ? (
          <Link href={`/admin/articles/${record.article.id}`}>{record.article.title}</Link>
        ) : (
          <Link href="/admin/memos">{record.memo?.content || `动态 #${record.memo?.id}`}</Link>
        )
      ),
    },
    {
      title: "评论者",
      dataIndex: "commenter",
      key: "commenter",
      width: 120,
    },
    {
      title: "状态",
      dataIndex: "is_approved",
      key: "is_approved",
      width: 100,
      render: (approved: boolean) =>
        approved ? (
          <Tag color="success">已通过</Tag>
        ) : (
          <Tag icon={<ClockCircleOutlined />} color="warning">
            待审核
          </Tag>
        ),
    },
  ];

  const fileColumns: TableColumnsType<RecentFile> = [
    {
      title: "文件",
      dataIndex: "relative_path",
      key: "relative_path",
      ellipsis: true,
      render: (relativePath: string, record: RecentFile) => (
        <a href={`/uploads/${relativePath}`} target="_blank" rel="noreferrer">
          {record.original_name || relativePath}
        </a>
      ),
    },
    {
      title: "状态",
      dataIndex: "is_missing",
      key: "is_missing",
      width: 100,
      render: (isMissing: boolean) => (
        isMissing
          ? <Tag color="error">缺失</Tag>
          : <Tag color="success">正常</Tag>
      ),
    },
    {
      title: "大小",
      dataIndex: "size",
      key: "size",
      width: 120,
      render: (size: number) => formatBytes(size),
    },
    {
      title: "时间",
      dataIndex: "created_at",
      key: "created_at",
      width: 180,
      render: (date: string) => new Date(date).toLocaleString("zh-CN"),
    },
  ];

  const memoColumns: TableColumnsType<RecentMemo> = [
    {
      title: "内容",
      dataIndex: "content",
      key: "content",
      ellipsis: true,
    },
    {
      title: "状态",
      dataIndex: "is_published",
      key: "is_published",
      width: 100,
      render: (published: boolean) => (
        <Tag color={published ? "success" : "default"}>
          {published ? "已发布" : "草稿"}
        </Tag>
      ),
    },
    {
      title: "时间",
      dataIndex: "created_at",
      key: "created_at",
      width: 180,
      render: (date: string) => new Date(date).toLocaleString("zh-CN"),
    },
  ];

  return (
    <div style={{ paddingBottom: 28 }}>
      {contextHolder}
      <AdminDashboardHeader onManageArticles={() => router.push("/admin/articles")} />

      <DashboardQuickActionsCard actions={quickActions} />

      <DashboardStatsGrid items={statItems} />

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <RecentTableCard
            title="最近文章"
            viewAllHref="/admin/articles"
            dataSource={data?.recent_articles || []}
            columns={articleColumns}
            rowKey="id"
          />
        </Col>
        <Col xs={24} lg={12}>
          <RecentTableCard
            title="最近评论"
            viewAllHref="/admin/comments"
            dataSource={data?.recent_comments || []}
            columns={commentColumns}
            rowKey="id"
          />
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={12}>
          <RecentTableCard
            title="最近文件"
            viewAllHref="/admin/files"
            dataSource={data?.recent_files || []}
            columns={fileColumns}
            rowKey="id"
          />
        </Col>
        <Col xs={24} lg={12}>
          <RecentTableCard
            title="最近动态"
            viewAllHref="/admin/memos"
            dataSource={data?.recent_memos || []}
            columns={memoColumns}
            rowKey="id"
          />
        </Col>
      </Row>
    </div>
  );
}
