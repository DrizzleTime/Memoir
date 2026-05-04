import nodemailer from "nodemailer";
import { prisma } from "@/lib/prisma";

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatDateTime(date: Date): string {
  return date.toLocaleString("zh-CN", { hour12: false });
}

type TerminalEmailMetaRow = {
  label: string;
  value: string;
  href?: string;
};

type TerminalEmailBlockVariant = "primary" | "muted";

type TerminalEmailBlock = {
  label?: string;
  content: string;
  variant?: TerminalEmailBlockVariant;
};

function renderTerminalEmail(options: {
  title: string;
  meta: TerminalEmailMetaRow[];
  blocks: TerminalEmailBlock[];
  actionUrl: string;
  footerLines?: string[];
}): string {
  const divider = "────────────────────────────────────────";
  const fontFamily =
    'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace';

  const metaHtml = options.meta
    .map((row) => {
      const labelHtml = `<span style="color: #7c3aed;">${escapeHtml(row.label)}:</span>`;
      if (row.href) {
        const href = escapeHtml(row.href);
        return `<div style="margin: 0 0 4px 0;">${labelHtml} <a href="${href}" style="color: #0284c7; text-decoration: none;">${escapeHtml(row.value)}</a></div>`;
      }
      return `<div style="margin: 0 0 4px 0;">${labelHtml} ${escapeHtml(row.value)}</div>`;
    })
    .join("");

  const blocksHtml = options.blocks
    .map((block) => {
      const variant: TerminalEmailBlockVariant = block.variant || "primary";
      const styles =
        variant === "muted"
          ? "background: #f1f5f9; border: 1px solid #e5e7eb; border-left: 3px solid #cbd5e1; color: #475569;"
          : "background: #f8fafc; border: 1px solid #e5e7eb; border-left: 3px solid #10b981; color: #111827;";

      const labelHtml = block.label
        ? `<div style="margin: 0 0 6px 0; font-size: 12px;"><span style="color: #7c3aed;">${escapeHtml(block.label)}:</span></div>`
        : "";

      return `
        <div style="margin: 14px 0;">
          ${labelHtml}
          <div style="${styles} padding: 12px; white-space: pre-wrap; word-break: break-word;">${escapeHtml(block.content)}</div>
        </div>
      `;
    })
    .join("");

  const actionHref = escapeHtml(options.actionUrl);
  const footerHtml = (options.footerLines || ["此邮件由博客系统自动发送，请勿直接回复。"])
    .map((line) => `<div style="margin: 4px 0;">${escapeHtml(line)}</div>`)
    .join("");

  return `
    <div style="background: #ffffff; padding: 20px;">
      <div style="font-family: ${fontFamily}; max-width: 600px; margin: 0 auto; color: #111827;">
        <div style="font-size: 16px; font-weight: 700; margin: 0 0 12px 0;">
          <span style="color: #059669; font-weight: 700; margin-right: 8px;">❯</span>${escapeHtml(options.title)}
        </div>

        <div style="font-size: 13px; color: #6b7280;">
          ${metaHtml}
        </div>

        <div style="color: #d1d5db; font-size: 12px; margin: 16px 0;">${divider}</div>

        ${blocksHtml}

        <div style="color: #d1d5db; font-size: 12px; margin: 16px 0;">${divider}</div>

        <div style="font-size: 13px; color: #6b7280; margin: 0 0 18px 0;">
          <span style="color: #7c3aed;">cmd:</span>
          <a href="${actionHref}" style="color: #0284c7; text-decoration: none;">open ${escapeHtml(options.actionUrl)}</a>
        </div>

        <div style="font-size: 12px; color: #9ca3af; border-top: 1px solid #f1f5f9; padding-top: 12px;">
          ${footerHtml}
        </div>
      </div>
    </div>
  `;
}

export const SMTP_CONFIG_KEYS = [
  "smtp_host",
  "smtp_port",
  "smtp_user",
  "smtp_pass",
  "smtp_from",
  "smtp_from_name",
  "email_notify_enabled",
  "admin_email",
] as const;

export interface SmtpConfig {
  smtp_host: string;
  smtp_port: string;
  smtp_user: string;
  smtp_pass: string;
  smtp_from: string;
  smtp_from_name: string;
  email_notify_enabled: string;
  admin_email: string;
}

export async function getSmtpConfig(): Promise<SmtpConfig | null> {
  const configs = await prisma.config.findMany({
    where: {
      key: { in: [...SMTP_CONFIG_KEYS] },
    },
  });

  const configMap = configs.reduce(
    (acc: Partial<SmtpConfig>, config: (typeof configs)[number]) => {
      acc[config.key as keyof SmtpConfig] = config.value;
      return acc;
    },
    {} as Partial<SmtpConfig>
  );

  if (configMap.email_notify_enabled !== "true") {
    return null;
  }

  if (
    !configMap.smtp_host ||
    !configMap.smtp_port ||
    !configMap.smtp_user ||
    !configMap.smtp_pass ||
    !configMap.smtp_from
  ) {
    console.warn("SMTP 配置不完整，邮件通知已禁用");
    return null;
  }

  return configMap as SmtpConfig;
}

async function createTransporter() {
  const config = await getSmtpConfig();
  if (!config) {
    return null;
  }

  return nodemailer.createTransport({
    host: config.smtp_host,
    port: parseInt(config.smtp_port, 10),
    secure: parseInt(config.smtp_port, 10) === 465,
    auth: {
      user: config.smtp_user,
      pass: config.smtp_pass,
    },
  });
}

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail(options: SendEmailOptions): Promise<boolean> {
  try {
    const config = await getSmtpConfig();
    if (!config) {
      console.log("邮件通知未启用或配置不完整");
      return false;
    }

    const transporter = await createTransporter();
    if (!transporter) {
      return false;
    }

    const fromName = config.smtp_from_name || "博客通知";
    await transporter.sendMail({
      from: `"${fromName}" <${config.smtp_from}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });

    console.log(`邮件已发送至: ${options.to}`);
    return true;
  } catch (error) {
    console.error("发送邮件失败:", error);
    return false;
  }
}

interface CommentNotifyData {
  targetTitle: string;
  targetUrl: string;
  targetTypeLabel: string;
  createdAt: Date;
  commenterName: string;
  commentContent: string;
  isReply: boolean;
  parentCommenterName?: string;
  parentCommentContent?: string;
}

export async function sendNewCommentNotifyToAdmin(
  data: CommentNotifyData
): Promise<boolean> {
  const config = await getSmtpConfig();
  if (!config || !config.admin_email) {
    return false;
  }

  const subject = data.isReply
    ? `[博客] ${data.commenterName} 回复了评论`
    : `[博客] ${data.commenterName} 发表了新评论`;

  const parentPreview = data.parentCommentContent
    ? `${data.parentCommentContent.slice(0, 200)}${data.parentCommentContent.length > 200 ? "..." : ""}`
    : "";

  const blocks: TerminalEmailBlock[] = [];
  if (data.isReply && data.parentCommenterName && parentPreview) {
    blocks.push({
      label: `original(${data.parentCommenterName})`,
      content: parentPreview,
      variant: "muted",
    });
  }
  blocks.push({
    label: "comment",
    content: data.commentContent,
    variant: "primary",
  });

  const meta: TerminalEmailMetaRow[] = [
    { label: "time", value: formatDateTime(data.createdAt) },
    {
      label: "target",
      value: `${data.targetTypeLabel}: ${data.targetTitle}`,
      href: data.targetUrl,
    },
    { label: "from", value: data.commenterName },
  ];

  if (data.isReply && data.parentCommenterName) {
    meta.push({ label: "reply_to", value: data.parentCommenterName });
  }

  const html = renderTerminalEmail({
    title: data.isReply ? "新的评论回复" : "新的评论",
    meta,
    blocks,
    actionUrl: data.targetUrl,
  });

  return sendEmail({
    to: config.admin_email,
    subject,
    html,
  });
}

export async function sendReplyNotifyToCommenter(
  commenterEmail: string,
  data: CommentNotifyData
): Promise<boolean> {
  const subject = `[博客] ${data.commenterName} 回复了您的评论`;

  const parentPreview = data.parentCommentContent
    ? `${data.parentCommentContent.slice(0, 200)}${data.parentCommentContent.length > 200 ? "..." : ""}`
    : "";

  const blocks: TerminalEmailBlock[] = [];
  if (parentPreview) {
    blocks.push({
      label: "your_comment",
      content: parentPreview,
      variant: "muted",
    });
  }
  blocks.push({
    label: "reply",
    content: data.commentContent,
    variant: "primary",
  });

  const meta: TerminalEmailMetaRow[] = [
    { label: "time", value: formatDateTime(data.createdAt) },
    {
      label: "target",
      value: `${data.targetTypeLabel}: ${data.targetTitle}`,
      href: data.targetUrl,
    },
    { label: "from", value: data.commenterName },
  ];

  const html = renderTerminalEmail({
    title: "您的评论收到了回复",
    meta,
    blocks,
    actionUrl: data.targetUrl,
    footerLines: [
      "此邮件由博客系统自动发送，请勿直接回复。",
      "如果您不想收到此类邮件，请联系管理员。",
    ],
  });

  return sendEmail({
    to: commenterEmail,
    subject,
    html,
  });
}
