import { prisma } from "@/lib/prisma";
import { revalidateMemos } from "@/lib/revalidate";
import { saveBufferAsUploadFile } from "@/lib/upload-file";

const FEISHU_API_BASE = "https://open.feishu.cn";
const FEISHU_LOG_PREFIX = "[feishu]";

export const FEISHU_CONFIG_KEYS = [
  "feishu_app_id",
  "feishu_app_secret",
  "feishu_verification_token",
] as const;

export interface FeishuConfig {
  feishu_app_id: string;
  feishu_app_secret: string;
  feishu_verification_token: string;
}

export interface FeishuEventRequestBody {
  type?: string;
  token?: string;
  challenge?: string;
  encrypt?: string;
  header?: {
    event_id?: string;
    event_type?: string;
    token?: string;
  };
  event?: {
    sender?: {
      sender_type?: string;
    };
    message?: {
      chat_type?: string;
      content?: string;
      message_id?: string;
      message_type?: string;
      parent_id?: string;
      root_id?: string;
    };
  };
}

export interface FeishuPublishResult {
  created: boolean;
  ignored: boolean;
  reason: string;
}

type FeishuTextSegment = {
  type: "text";
  text: string;
};

type FeishuImageSegment = {
  type: "image";
  imageKey: string;
};

type FeishuSegment = FeishuTextSegment | FeishuImageSegment;

type FeishuPostLocaleContent = {
  title?: string;
  content?: unknown[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function logFeishu(message: string, context?: Record<string, unknown>) {
  if (context) {
    console.log(FEISHU_LOG_PREFIX, message, context);
    return;
  }

  console.log(FEISHU_LOG_PREFIX, message);
}

function getRawContentPreview(rawContent: string | undefined, maxLength = 200): string | null {
  if (!rawContent) return null;
  const normalized = rawContent.replaceAll("\n", "\\n");
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength)}...`;
}

export function getFeishuEventSummary(body: FeishuEventRequestBody) {
  const message = body.event?.message;
  const sender = body.event?.sender;

  return {
    type: body.type || null,
    eventType: body.header?.event_type || null,
    eventId: body.header?.event_id || null,
    senderType: sender?.sender_type || null,
    chatType: message?.chat_type || null,
    messageType: message?.message_type || null,
    messageId: message?.message_id || null,
    hasToken: Boolean(body.token || body.header?.token),
    hasEncrypt: Boolean(body.encrypt),
    contentPreview: getRawContentPreview(message?.content),
  };
}

function pickFeishuPostLocaleContent(raw: unknown): FeishuPostLocaleContent | null {
  if (!isRecord(raw)) return null;

  const prioritizedLocales = ["zh_cn", "en_us"];
  for (const locale of prioritizedLocales) {
    const value = raw[locale];
    if (isRecord(value)) {
      return value as FeishuPostLocaleContent;
    }
  }

  for (const value of Object.values(raw)) {
    if (isRecord(value) && Array.isArray(value.content)) {
      return value as FeishuPostLocaleContent;
    }
  }

  return null;
}

function normalizeTextBlock(text: string): string {
  return text
    .replaceAll("\r\n", "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function joinMarkdownBlocks(blocks: string[]): string {
  return blocks
    .map((block) => normalizeTextBlock(block))
    .filter(Boolean)
    .join("\n\n")
    .trim();
}

function parseFeishuTextContent(rawContent: string): FeishuSegment[] {
  const parsed = JSON.parse(rawContent) as { text?: unknown };
  if (typeof parsed.text !== "string") return [];

  const text = normalizeTextBlock(parsed.text);
  return text ? [{ type: "text", text }] : [];
}

function parseFeishuImageContent(rawContent: string): FeishuSegment[] {
  const parsed = JSON.parse(rawContent) as { image_key?: unknown };
  if (typeof parsed.image_key !== "string" || !parsed.image_key.trim()) return [];
  return [{ type: "image", imageKey: parsed.image_key.trim() }];
}

function parseFeishuPostContent(rawContent: string): FeishuSegment[] {
  const parsed = JSON.parse(rawContent) as unknown;
  const localeContent = pickFeishuPostLocaleContent(parsed);
  if (!localeContent) return [];

  const segments: FeishuSegment[] = [];
  const title = typeof localeContent.title === "string"
    ? normalizeTextBlock(localeContent.title)
    : "";

  if (title) {
    segments.push({ type: "text", text: title });
  }

  const paragraphs = Array.isArray(localeContent.content) ? localeContent.content : [];
  for (const paragraph of paragraphs) {
    if (!Array.isArray(paragraph)) continue;

    let line = "";
    for (const item of paragraph) {
      if (!isRecord(item) || typeof item.tag !== "string") continue;

      if (item.tag === "text" && typeof item.text === "string") {
        line += item.text;
        continue;
      }

      if (item.tag === "a") {
        const text = typeof item.text === "string" ? item.text : "";
        const href = typeof item.href === "string" ? item.href : "";
        line += text && href ? `[${text}](${href})` : text || href;
        continue;
      }

      if (item.tag === "at") {
        const name =
          typeof item.user_name === "string"
            ? item.user_name
            : typeof item.text === "string"
              ? item.text
              : "用户";
        line += `@${name}`;
        continue;
      }

      if (item.tag === "img" && typeof item.image_key === "string") {
        const text = normalizeTextBlock(line);
        if (text) {
          segments.push({ type: "text", text });
          line = "";
        }

        segments.push({ type: "image", imageKey: item.image_key.trim() });
      }
    }

    const text = normalizeTextBlock(line);
    if (text) {
      segments.push({ type: "text", text });
    }
  }

  return segments;
}

function parseFeishuSegments(messageType: string, rawContent: string): FeishuSegment[] {
  try {
    if (messageType === "text") return parseFeishuTextContent(rawContent);
    if (messageType === "image") return parseFeishuImageContent(rawContent);
    if (messageType === "post") return parseFeishuPostContent(rawContent);
    logFeishu("收到未支持的消息类型", {
      messageType,
      rawContentPreview: getRawContentPreview(rawContent),
    });
    return [];
  } catch (error) {
    console.error(FEISHU_LOG_PREFIX, "解析飞书消息失败", {
      messageType,
      rawContentPreview: getRawContentPreview(rawContent),
      error,
    });
    return [];
  }
}

function inferExtensionFromMimeType(mimeType: string | null): string {
  if (!mimeType) return ".png";

  if (mimeType.includes("jpeg")) return ".jpg";
  if (mimeType.includes("png")) return ".png";
  if (mimeType.includes("gif")) return ".gif";
  if (mimeType.includes("webp")) return ".webp";
  return ".png";
}

function getFilenameFromContentDisposition(contentDisposition: string | null): string | null {
  if (!contentDisposition) return null;

  const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    return decodeURIComponent(utf8Match[1]);
  }

  const plainMatch = contentDisposition.match(/filename="([^"]+)"/i);
  if (plainMatch?.[1]) {
    return plainMatch[1];
  }

  return null;
}

function getNonEmptyString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function extractReplyIds(message: unknown): {
  parentId: string | null;
  rootId: string | null;
} {
  if (!isRecord(message)) {
    return { parentId: null, rootId: null };
  }

  return {
    parentId: getNonEmptyString(message.parent_id),
    rootId: getNonEmptyString(message.root_id),
  };
}

function isUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2002"
  );
}

export async function getFeishuConfig(): Promise<FeishuConfig | null> {
  const configs = await prisma.config.findMany({
    where: {
      key: { in: [...FEISHU_CONFIG_KEYS] },
    },
  });

  const configMap = configs.reduce(
    (acc: Partial<FeishuConfig>, config: (typeof configs)[number]) => {
      acc[config.key as keyof FeishuConfig] = config.value;
      return acc;
    },
    {} as Partial<FeishuConfig>
  );

  const missingKeys = FEISHU_CONFIG_KEYS.filter((key) => !configMap[key]);
  if (missingKeys.length > 0) {
    console.warn(FEISHU_LOG_PREFIX, "飞书配置不完整", { missingKeys });
    return null;
  }

  return configMap as FeishuConfig;
}

export function isFeishuVerificationTokenValid(
  config: FeishuConfig,
  token: string | undefined
): boolean {
  return !!token && token === config.feishu_verification_token;
}

async function getFeishuTenantAccessToken(config: FeishuConfig): Promise<string> {
  logFeishu("开始获取 tenant_access_token");
  const response = await fetch(
    `${FEISHU_API_BASE}/open-apis/auth/v3/tenant_access_token/internal`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        app_id: config.feishu_app_id,
        app_secret: config.feishu_app_secret,
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error(FEISHU_LOG_PREFIX, "获取 tenant_access_token 失败", {
      status: response.status,
      errorText,
    });
    throw new Error("获取飞书 tenant_access_token 失败");
  }

  const data = await response.json() as {
    tenant_access_token?: string;
  };

  if (!data.tenant_access_token) {
    throw new Error("飞书 tenant_access_token 响应无效");
  }

  logFeishu("获取 tenant_access_token 成功");
  return data.tenant_access_token;
}

async function downloadFeishuImage(params: {
  tenantAccessToken: string;
  messageId: string;
  imageKey: string;
}): Promise<string> {
  logFeishu("开始下载飞书图片", {
    messageId: params.messageId,
    imageKey: params.imageKey,
  });
  const resourceUrl = new URL(
    `${FEISHU_API_BASE}/open-apis/im/v1/messages/${params.messageId}/resources/${params.imageKey}`
  );
  resourceUrl.searchParams.set("type", "image");

  const response = await fetch(resourceUrl, {
    headers: {
      Authorization: `Bearer ${params.tenantAccessToken}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`下载飞书图片失败: ${errorText || response.statusText}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  const mimeType = response.headers.get("content-type");
  const filenameFromHeader = getFilenameFromContentDisposition(
    response.headers.get("content-disposition")
  );
  const originalName = filenameFromHeader
    || `feishu-${params.messageId}-${params.imageKey}${inferExtensionFromMimeType(mimeType)}`;

  const uploaded = await saveBufferAsUploadFile({
    buffer,
    originalName,
    mimeType,
  });

  logFeishu("飞书图片已本地化", {
    messageId: params.messageId,
    imageKey: params.imageKey,
    uploadedUrl: uploaded.url,
  });
  return uploaded.url;
}

async function getFeishuMessageReplyInfo(params: {
  config: FeishuConfig;
  messageId: string;
  fallbackParentId?: string | null;
  fallbackRootId?: string | null;
}): Promise<{
  parentId: string | null;
  rootId: string | null;
}> {
  const fallback = {
    parentId: params.fallbackParentId || null,
    rootId: params.fallbackRootId || null,
  };

  try {
    const tenantAccessToken = await getFeishuTenantAccessToken(params.config);
    const response = await fetch(
      `${FEISHU_API_BASE}/open-apis/im/v1/messages/${params.messageId}`,
      {
        headers: {
          Authorization: `Bearer ${tenantAccessToken}`,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(FEISHU_LOG_PREFIX, "获取飞书消息详情失败", {
        messageId: params.messageId,
        status: response.status,
        errorText,
      });
      return fallback;
    }

    const data = await response.json() as {
      data?: {
        message?: unknown;
        items?: unknown[];
      };
    };
    const message =
      data.data?.message
      || (Array.isArray(data.data?.items) ? data.data.items[0] : null);
    const extracted = extractReplyIds(message);

    return {
      parentId: extracted.parentId || fallback.parentId,
      rootId: extracted.rootId || fallback.rootId,
    };
  } catch (error) {
    console.error(FEISHU_LOG_PREFIX, "获取飞书消息详情异常", {
      messageId: params.messageId,
      error,
    });
    return fallback;
  }
}

async function findMemoBySourceMessageId(sourceMessageId: string) {
  const sourceMessage = await prisma.memoSourceMessage.findUnique({
    where: { sourceMessageId },
    include: {
      memo: {
        select: {
          id: true,
          content: true,
        },
      },
    },
  });

  if (sourceMessage?.memo) {
    return sourceMessage.memo;
  }

  return prisma.memo.findUnique({
    where: { sourceMessageId },
    select: {
      id: true,
      content: true,
    },
  });
}

async function buildMemoContentFromSegments(params: {
  config: FeishuConfig;
  messageId: string;
  segments: FeishuSegment[];
}): Promise<string> {
  const blocks: string[] = [];
  let tenantAccessToken: string | null = null;

  for (const segment of params.segments) {
    if (segment.type === "text") {
      const text = normalizeTextBlock(segment.text);
      if (text) {
        blocks.push(text);
      }
      continue;
    }

    tenantAccessToken ||= await getFeishuTenantAccessToken(params.config);
    const imageUrl = await downloadFeishuImage({
      tenantAccessToken,
      messageId: params.messageId,
      imageKey: segment.imageKey,
    });
    blocks.push(`![](${imageUrl})`);
  }

  return joinMarkdownBlocks(blocks);
}

export async function publishFeishuMessageAsMemo(params: {
  config: FeishuConfig;
  body: FeishuEventRequestBody;
}): Promise<FeishuPublishResult> {
  const event = params.body.event;
  const message = event?.message;
  const sender = event?.sender;
  const summary = getFeishuEventSummary(params.body);

  logFeishu("开始处理飞书消息", summary);

  if (params.body.header?.event_type !== "im.message.receive_v1") {
    logFeishu("忽略事件：event_type 不匹配", summary);
    return { created: false, ignored: true, reason: "event_type_not_supported" };
  }

  if (sender?.sender_type !== "user") {
    logFeishu("忽略事件：sender_type 不是 user", summary);
    return { created: false, ignored: true, reason: "sender_not_user" };
  }

  if (message?.chat_type !== "p2p") {
    logFeishu("忽略事件：不是私聊消息", summary);
    return { created: false, ignored: true, reason: "chat_type_not_p2p" };
  }

  if (!message.message_id || !message.message_type || !message.content) {
    logFeishu("忽略事件：消息字段不完整", summary);
    return { created: false, ignored: true, reason: "message_incomplete" };
  }

  const messageId = message.message_id;
  const messageType = message.message_type;
  const rawContent = message.content;

  const existingSourceMessage = await prisma.memoSourceMessage.findUnique({
    where: { sourceMessageId: messageId },
    select: { id: true },
  });
  if (existingSourceMessage) {
    logFeishu("忽略事件：消息已处理过", summary);
    return { created: false, ignored: true, reason: "duplicate_message" };
  }

  const existing = await prisma.memo.findUnique({
    where: { sourceMessageId: messageId },
    select: { id: true },
  });
  if (existing) {
    logFeishu("忽略事件：消息已处理过", {
      ...summary,
      existingMemoId: existing.id,
    });
    return { created: false, ignored: true, reason: "duplicate_message" };
  }

  const segments = parseFeishuSegments(messageType, rawContent);
  if (segments.length === 0) {
    logFeishu("忽略事件：没有解析出可发布内容", {
      ...summary,
      messageType,
    });
    return { created: false, ignored: true, reason: "empty_segments" };
  }

  logFeishu("飞书消息解析完成", {
    ...summary,
    segmentCount: segments.length,
    segmentTypes: segments.map((segment) => segment.type),
  });

  const content = await buildMemoContentFromSegments({
    config: params.config,
    messageId,
    segments,
  });
  if (!content) {
    logFeishu("忽略事件：生成的 memo 内容为空", summary);
    return { created: false, ignored: true, reason: "empty_content" };
  }

  logFeishu("生成 memo 内容完成", {
    ...summary,
    contentLength: content.length,
    contentPreview: content.slice(0, 200),
  });

  const eventReplyIds = extractReplyIds(message);
  const replyInfo = await getFeishuMessageReplyInfo({
    config: params.config,
    messageId,
    fallbackParentId: eventReplyIds.parentId,
    fallbackRootId: eventReplyIds.rootId,
  });
  const targetSourceMessageId = replyInfo.rootId || replyInfo.parentId;

  try {
    if (targetSourceMessageId) {
      const targetMemo = await findMemoBySourceMessageId(targetSourceMessageId);

      if (targetMemo) {
        await prisma.$transaction(async (tx) => {
          const nextContent = joinMarkdownBlocks([targetMemo.content, content]);

          await tx.memo.update({
            where: { id: targetMemo.id },
            data: {
              content: nextContent,
            },
          });

          await tx.memoSourceMessage.create({
            data: {
              memoId: targetMemo.id,
              sourceMessageId: messageId,
              parentSourceMessageId: replyInfo.parentId,
              rootSourceMessageId: replyInfo.rootId,
            },
          });
        });

        logFeishu("已追加内容到现有 memo", {
          ...summary,
          memoId: targetMemo.id,
          parentSourceMessageId: replyInfo.parentId,
          rootSourceMessageId: replyInfo.rootId,
        });

        revalidateMemos();
        logFeishu("已触发 memo 页面刷新", summary);
        return { created: true, ignored: false, reason: "appended_to_existing_memo" };
      }
    }

    const memo = await prisma.memo.create({
      data: {
        content,
        isPublished: true,
        source: "feishu",
        sourceMessageId: messageId,
        sourceMessages: {
          create: {
            sourceMessageId: messageId,
            parentSourceMessageId: replyInfo.parentId,
            rootSourceMessageId: replyInfo.rootId,
          },
        },
      },
    });

    logFeishu("已写入 memo", {
      ...summary,
      memoId: memo.id,
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      logFeishu("忽略事件：并发写入导致重复", summary);
      return { created: false, ignored: true, reason: "duplicate_message_race" };
    }
    console.error(FEISHU_LOG_PREFIX, "写入 memo 失败", {
      ...summary,
      error,
    });
    throw error;
  }

  revalidateMemos();
  logFeishu("已触发 memo 页面刷新", summary);

  return { created: true, ignored: false, reason: "created" };
}
