"use client";

import React, { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import {
  ConfigProvider,
  Layout,
  Menu,
  Button,
  Dropdown,
  Avatar,
  Drawer,
  Grid,
  Tooltip,
  theme,
} from "antd";
import type { MenuProps } from "antd";
import {
  DashboardOutlined,
  FileTextOutlined,
  AppstoreOutlined,
  CommentOutlined,
  UserOutlined,
  SettingOutlined,
  FolderOutlined,
  PictureOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  LogoutOutlined,
  LinkOutlined,
  MessageOutlined,
  HomeOutlined,
  DatabaseOutlined,
  BarChartOutlined,
  GithubOutlined,
} from "@ant-design/icons";
import zhCN from "antd/locale/zh_CN";
import { AdminAuthProvider, useAdminAuth } from "@/lib/admin-auth";

const { Header, Sider, Content } = Layout;
const { useBreakpoint } = Grid;

type AdminRouteItem = {
  key: string;
  icon: React.ReactNode;
  label: string;
  group: string;
};

const routeItems: AdminRouteItem[] = [
  { key: "/admin", icon: <DashboardOutlined />, label: "仪表盘", group: "概览" },
  { key: "/admin/visits", icon: <BarChartOutlined />, label: "访问统计", group: "概览" },
  { key: "/admin/articles", icon: <FileTextOutlined />, label: "文章管理", group: "内容" },
  { key: "/admin/memos", icon: <MessageOutlined />, label: "动态管理", group: "内容" },
  { key: "/admin/categories", icon: <AppstoreOutlined />, label: "分类管理", group: "内容" },
  { key: "/admin/links", icon: <LinkOutlined />, label: "链接管理", group: "内容" },
  { key: "/admin/comments", icon: <CommentOutlined />, label: "评论管理", group: "互动" },
  { key: "/admin/albums", icon: <PictureOutlined />, label: "相册管理", group: "资源" },
  { key: "/admin/files", icon: <FolderOutlined />, label: "文件管理", group: "资源" },
  { key: "/admin/users", icon: <UserOutlined />, label: "用户管理", group: "系统" },
  { key: "/admin/settings", icon: <SettingOutlined />, label: "系统配置", group: "系统" },
  { key: "/admin/backup", icon: <DatabaseOutlined />, label: "备份恢复", group: "系统" },
];

const routeGroups = ["概览", "内容", "互动", "资源", "系统"] as const;

const menuItems: MenuProps["items"] = routeGroups.map((group) => ({
  type: "group" as const,
  key: `group-${group}`,
  label: group,
  children: routeItems
    .filter((item) => item.group === group)
    .map((item) => ({ key: item.key, icon: item.icon, label: item.label })),
}));

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, isLoading, token } = useAdminAuth();
  const screens = useBreakpoint();
  const isMobile = Boolean(screens.xs || (screens.sm && !screens.md));
  const {
    token: {
      colorBgLayout,
      colorBorderSecondary,
      colorTextHeading,
    },
  } = theme.useToken();

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  if (isLoading || !token) {
    return null;
  }

  const handleMenuClick: MenuProps["onClick"] = (e) => {
    router.push(e.key);
    setMobileMenuOpen(false);
  };

  const getSelectedKey = () => {
    const exactMatch = routeItems.find((item) => item.key === pathname);
    if (exactMatch) return exactMatch.key;

    const match = routeItems
      .filter((item) => item.key !== "/admin")
      .find((item) => pathname.startsWith(item.key));

    if (match) return match.key;
    return "/admin";
  };

  const userMenuItems: MenuProps["items"] = [
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: "退出登录",
      onClick: logout,
    },
  ];

  return (
    <Layout style={{ minHeight: "100vh" }}>
      {!isMobile && (
        <Sider
          trigger={null}
          collapsible
          collapsed={collapsed}
          theme="light"
          width={200}
          collapsedWidth={80}
          className="memoir-admin-sider"
          style={{
            borderRight: `1px solid ${colorBorderSecondary}`,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            className="memoir-admin-logo"
            style={{
              height: 64,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <h1
              style={{
                margin: 0,
                fontSize: collapsed ? 16 : 18,
                fontWeight: 600,
                color: colorTextHeading,
                whiteSpace: "nowrap",
              }}
            >
              {collapsed ? "M" : "Memoir"}
            </h1>
          </div>
          <Menu
            mode="inline"
            selectedKeys={[getSelectedKey()]}
            items={menuItems}
            onClick={handleMenuClick}
            className="memoir-admin-menu"
            style={{ borderRight: 0, flex: 1, overflowY: "auto" }}
          />
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              padding: "10px 14px 14px",
              borderTop: `1px solid ${colorBorderSecondary}`,
            }}
          >
            <Tooltip title="GitHub" placement={collapsed ? "right" : "top"}>
              <Button
                type="text"
                shape="circle"
                icon={<GithubOutlined />}
                href="https://github.com/DrizzleTime/Memoir"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub"
                style={{ width: 40, height: 40 }}
              />
            </Tooltip>
          </div>
        </Sider>
      )}
      <Layout
        style={{ background: colorBgLayout, height: "100vh", overflow: "hidden" }}
      >
        <Header
          className="memoir-admin-header"
          style={{
            height: isMobile ? 56 : 64,
            padding: isMobile ? "0 12px" : "0 20px",
            background: "rgba(255, 255, 255, 0.82)",
            backdropFilter: "blur(14px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: `1px solid ${colorBorderSecondary}`,
          }}
        >
          <Button
            type="text"
            icon={
              isMobile
                ? <MenuUnfoldOutlined />
                : collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />
            }
            onClick={() => {
              if (isMobile) {
                setMobileMenuOpen(true);
                return;
              }
              setCollapsed(!collapsed);
            }}
            style={{ fontSize: 16, width: isMobile ? 40 : 48, height: isMobile ? 40 : 48 }}
          />
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Button
              type="text"
              icon={<HomeOutlined />}
              onClick={() => window.open("/", "_blank", "noopener,noreferrer")}
              style={{ width: isMobile ? 40 : undefined, paddingInline: isMobile ? 0 : undefined }}
            >
              {!isMobile && "前台"}
            </Button>
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <div
                style={{
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  maxWidth: isMobile ? 40 : 180,
                }}
              >
                <Avatar
                  size="small"
                  icon={<UserOutlined />}
                  src={user?.avatar}
                />
                {!isMobile && <span>{user?.nickname || user?.username}</span>}
              </div>
            </Dropdown>
          </div>
        </Header>
        <Content
          className="memoir-admin-content"
          style={{
            margin: 0,
            padding: isMobile ? 12 : 28,
            background: "transparent",
            overflow: "auto",
            flex: 1,
            minHeight: 0,
          }}
        >
          {children}
        </Content>
      </Layout>
      <Drawer
        title="Memoir"
        placement="left"
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        size={280}
        className="memoir-admin-mobile-drawer"
        styles={{ body: { padding: 0 } }}
      >
        <Menu
          mode="inline"
          selectedKeys={[getSelectedKey()]}
          items={menuItems}
          onClick={handleMenuClick}
          className="memoir-admin-menu"
          style={{ borderRight: 0 }}
        />
      </Drawer>
    </Layout>
  );
}

export default function AdminLayoutShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="memoir-admin"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1000,
        background: "linear-gradient(180deg, #f8fafc 0%, #f3f4f6 100%)",
      }}
    >
      <AntdRegistry>
        <ConfigProvider
          locale={zhCN}
          theme={{
            token: {
              colorPrimary: "#111827",
              colorBgLayout: "#f3f4f6",
              colorBgContainer: "#ffffff",
              colorBorder: "#e5e7eb",
              colorBorderSecondary: "#e5e7eb",
              colorText: "#0f172a",
              colorTextSecondary: "#475569",
              borderRadius: 16,
              fontFamily:
                "system-ui, -apple-system, \"Segoe UI\", \"Helvetica Neue\", Arial, \"Noto Sans\", \"PingFang SC\", \"Hiragino Sans GB\", \"Microsoft YaHei\", sans-serif",
              boxShadow:
                "0 10px 30px rgba(15, 23, 42, 0.05)",
              boxShadowSecondary:
                "0 8px 24px rgba(15, 23, 42, 0.05)",
              boxShadowTertiary:
                "0 6px 18px rgba(15, 23, 42, 0.04)",
            },
            components: {
              Layout: {
                headerBg: "rgba(255, 255, 255, 0.82)",
                siderBg: "rgba(255, 255, 255, 0.72)",
              },
              Menu: {
                itemBorderRadius: 14,
                subMenuItemBorderRadius: 14,
                itemHeight: 42,
                itemHoverBg: "#eef2f7",
                itemActiveBg: "#e5e7eb",
                itemSelectedBg: "#e8eef8",
                groupTitleColor: "#6b7280",
                groupTitleFontSize: 12,
              },
            },
          }}
        >
          <AdminAuthProvider>
            <AdminLayoutContent>{children}</AdminLayoutContent>
          </AdminAuthProvider>
        </ConfigProvider>
      </AntdRegistry>
    </div>
  );
}
