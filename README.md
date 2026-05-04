<div align="center">

# Memoir

Memoir 是一个面向个人内容沉淀的自托管博客与记录系统。

[![License](https://img.shields.io/github/license/DrizzleTime/Memoir?style=flat-square)](./LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=nextdotjs)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![Bun](https://img.shields.io/badge/Bun-runtime-f4c542?style=flat-square&logo=bun)](https://bun.sh/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=flat-square&logo=prisma)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-database-316192?style=flat-square&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/github/actions/workflow/status/DrizzleTime/Memoir/docker.yml?branch=main&style=flat-square&label=Docker%20build)](https://github.com/DrizzleTime/Memoir/actions/workflows/docker.yml)

</div>

Memoir 把长文章、短记录、相册、友链、评论、文件和访问统计放在同一个后台里管理，适合长期维护个人站点。

## 目录

- [概览](#概览)
- [功能](#功能)
- [技术栈](#技术栈)
- [快速部署](#快速部署)
- [本地开发](#本地开发)
- [常用命令](#常用命令)
- [项目结构](#项目结构)
- [API 概览](#api-概览)
- [质量检查](#质量检查)

## 概览

### 适用场景

- 写作和发布个人文章
- 记录短内容、近况或碎片想法
- 管理公开相册和站点图片
- 维护友链和个人页面
- 查看站点访问情况
- 通过 Docker 快速部署自己的内容站点

### 入口

| 入口 | 说明 |
| --- | --- |
| `/` | 站点首页 |
| `/install` | 首次安装页 |
| `/admin` | 后台首页 |
| `/admin/login` | 后台登录 |
| `/search` | 搜索页 |
| `/albums` | 相册页 |
| `/links` | 友链页 |
| `/now` | 近况页 |

## 功能

### 内容发布

| 能力 | 说明 |
| --- | --- |
| 文章管理 | 创建、编辑、删除 |
| 文章状态 | 草稿、发布、私密 |
| 分类 | 文章分类管理 |
| 历史 | 文章历史版本 |
| 渲染 | Markdown 和代码高亮 |

### 短记录

| 能力 | 说明 |
| --- | --- |
| 备忘 | 短内容记录与管理 |
| 公开展示 | 公开备忘列表 |
| 来源 | 记录外部来源消息 |
| 评论 | 备忘评论 |

### 评论系统

| 能力 | 说明 |
| --- | --- |
| 评论对象 | 文章、备忘 |
| 账号类型 | 登录用户、匿名用户 |
| 结构 | 嵌套回复 |
| 管理 | 后台评论管理 |

### 媒体与相册

| 能力 | 说明 |
| --- | --- |
| 文件上传 | 支持上传文件 |
| 图片处理 | 图片预览、WebP 转换 |
| 文件管理 | 重命名、状态同步、WebP 清理 |
| 相册 | 公开相册、图片排序 |

### 站点运营

| 能力 | 说明 |
| --- | --- |
| 友链 | 管理与有效性检查 |
| 统计 | 访问日志、设备、浏览器、系统、地区 |
| 输出 | RSS Feed、sitemap、robots.txt |
| 元数据 | canonical、Open Graph |

### 后台管理

| 能力 | 说明 |
| --- | --- |
| 初始化 | 首个管理员初始化 |
| 登录 | 后台会话 |
| 用户 | 用户管理 |
| 配置 | 站点、邮件、飞书、AI 配置 |
| 运维 | 数据备份与恢复 |

## 技术栈

| 类型 | 技术 |
| --- | --- |
| 框架 | Next.js 16 App Router |
| 运行时 | Bun |
| UI | React 19, Ant Design, Tailwind CSS |
| 数据库 | PostgreSQL |
| ORM | Prisma |
| 认证 | 自定义 JWT |
| 图片处理 | sharp |
| Markdown | react-markdown, unified, remark, rehype |

## 快速部署

推荐使用 Docker 部署。你需要先准备一个空的 PostgreSQL 数据库。

保存下面的 `docker-compose.yml`：

```yaml
services:
  app:
    image: ghcr.io/shiyu/memoir:latest
    container_name: memoir
    restart: unless-stopped
    ports:
      - "3000:3000"
    volumes:
      - memoir_data:/app/data

volumes:
  memoir_data:
```

启动服务：

```bash
docker compose up -d
```

首次访问：

```text
http://localhost:3000
```

系统会自动跳转到 `/install`。安装页需要填写：

- PostgreSQL 数据库地址、端口、数据库名、用户名、密码
- 站点 URL、站点名称、标题、标语、描述、联系邮箱
- 管理员用户名、邮箱、密码

提交后，系统会完成这些操作：

- 连接数据库
- 创建表结构
- 写入站点配置
- 创建管理员账号
- 进入后台

安装完成后：

- 数据库连接和应用密钥保存在容器卷的 `/app/data/config.json`
- 上传文件保存在容器卷的 `/app/data/uploads`

不要删除 `memoir_data` volume，除非你要重新安装。

## 重新安装

Memoir 默认禁止公开重装。需要重新安装时，删除旧 volume，并使用空数据库重新启动：

```bash
docker compose down -v
docker compose up -d
```

## 本地开发

### 安装依赖

```bash
bun install
```

### 配置环境变量

复制示例文件：

```bash
cp .env.example .env
```

关键配置：

```env
DATABASE_URL="postgresql://user:password@localhost:5432/memoir"
JWT_SECRET="replace-with-a-long-random-secret"
SITE_URL="https://your-site.example"
```

说明：

- `DATABASE_URL` 是 PostgreSQL 连接地址。
- `JWT_SECRET` 用于旧部署方式。使用安装页后，系统会自动生成密钥并写入运行时配置文件。
- `SITE_URL` 用于旧部署方式。使用安装页后，站点 URL 会保存到数据库配置 `site_url` 中，并用于 canonical、Open Graph、sitemap、robots 和 feed 输出。

可选配置：

```env
# 开发环境把本地 /uploads 代理到已有站点，便于复用线上图片。
DEV_UPLOADS_ORIGIN="https://example.com"
```

### 初始化数据库

开发时如果不走安装页，可以手动初始化数据库：

```bash
bunx prisma db push
bunx prisma generate
```

### 初始化首个用户

使用安装页时不需要手动调用这个接口。

开发时如果不走安装页，系统只允许在用户表为空时通过公开接口注册首个用户。首个用户创建后，公开注册会关闭。

```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "action": "register",
    "username": "admin",
    "email": "admin@example.com",
    "password": "change-this-password",
    "nickname": "Admin"
  }'
```

创建后访问 `/admin/login` 登录后台。

### 启动开发服务器

```bash
bun dev
```

开发服务默认运行在：

```text
http://localhost:3000
```

## 常用命令

| 命令 | 说明 |
| --- | --- |
| `bun install` | 安装依赖 |
| `bun dev` | 启动开发服务器 |
| `bun run build` | 构建生产版本 |
| `bun run start` | 启动生产服务 |
| `bun run lint` | 运行 ESLint |
| `bunx prisma db push` | 同步数据库结构 |
| `bunx prisma generate` | 生成 Prisma Client |
| `bunx prisma studio` | 打开 Prisma Studio |

## 项目结构

```text
/
├── prisma/
│   └── schema.prisma          # Prisma 数据模型
├── public/                    # 静态资源
├── src/
│   ├── app/                   # App Router 页面和 API
│   │   ├── admin/             # 后台管理页面
│   │   ├── api/               # API 路由
│   │   ├── article/[id]/      # 文章详情
│   │   ├── albums/            # 相册页面
│   │   ├── links/             # 友链页面
│   │   └── now/               # 近况页面
│   ├── components/            # React 组件
│   ├── generated/prisma/      # Prisma 生成代码
│   ├── lib/                   # 共享逻辑
│   └── types/                 # TypeScript 类型
├── .env.example               # 环境变量示例
├── next.config.ts
└── package.json
```

不要手动编辑 `src/generated/prisma`。需要更新 Prisma Client 时，修改 `prisma/schema.prisma` 后运行：

```bash
bunx prisma generate
```

## API 概览

### 用户

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| `POST` | `/api/users` | 首个用户注册或登录 |
| `POST` | `/api/users/token` | OAuth2 兼容登录 |
| `GET` | `/api/users/me` | 获取当前用户信息 |
| `PUT` | `/api/users/me` | 更新当前用户信息 |
| `GET` | `/api/users/[id]` | 获取用户公开信息 |

### 内容

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| `GET` | `/api/articles` | 获取文章列表 |
| `POST` | `/api/articles` | 创建文章 |
| `GET` | `/api/articles/[id]` | 获取文章详情 |
| `PUT` | `/api/articles/[id]` | 更新文章 |
| `DELETE` | `/api/articles/[id]` | 删除文章 |
| `GET` | `/api/articles/my` | 获取我的文章 |
| `GET` | `/api/memos` | 获取公开备忘 |
| `GET` | `/api/links` | 获取公开友链 |

### 评论

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| `POST` | `/api/comments` | 创建评论 |
| `GET` | `/api/comments/article/[id]` | 获取文章评论 |
| `GET` | `/api/comments/memo/[id]` | 获取备忘评论 |
| `GET` | `/api/comments/[id]` | 获取评论详情 |
| `PUT` | `/api/comments/[id]` | 更新评论 |
| `DELETE` | `/api/comments/[id]` | 删除评论 |

## 质量检查

当前仓库没有独立自动化测试套件。合并前至少运行：

```bash
bun run lint
bun run build
```

涉及文章、评论、后台、上传、相册、备份或 Prisma schema 的改动，需要手动验证相关流程。

## License

MIT
