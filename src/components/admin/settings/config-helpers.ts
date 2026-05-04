import type {
  AIConfigFormValues,
  ConfigItem,
  ConfigMutationItem,
  EmailConfigFormValues,
  FeishuConfigFormValues,
  SiteConfigFormValues,
} from "@/components/admin/settings/types";

export const RESERVED_CONFIG_KEYS = [
  "site_url",
  "site_name",
  "site_title",
  "site_tagline",
  "site_description",
  "site_contact_email",
  "ai_endpoint",
  "ai_model",
  "ai_api_key",
  "feishu_app_id",
  "feishu_app_secret",
  "feishu_verification_token",
  "smtp_host",
  "smtp_port",
  "smtp_user",
  "smtp_pass",
  "smtp_from",
  "smtp_from_name",
  "admin_email",
  "email_notify_enabled",
];

function getConfigValue(configs: ConfigItem[], key: string, fallback = "") {
  return configs.find((config) => config.key === key)?.value || fallback;
}

export function getSiteConfigValues(configs: ConfigItem[]): SiteConfigFormValues {
  return {
    site_url: getConfigValue(configs, "site_url", "http://localhost:3000"),
    site_name: getConfigValue(configs, "site_name", "Memoir"),
    site_title: getConfigValue(configs, "site_title", "Memoir"),
    site_tagline: getConfigValue(configs, "site_tagline", "个人博客系统"),
    site_description: getConfigValue(
      configs,
      "site_description",
      "一个基于 Next.js 的个人博客系统。"
    ),
    site_contact_email: getConfigValue(
      configs,
      "site_contact_email",
      "admin@example.com"
    ),
  };
}

export function getAiConfigValues(configs: ConfigItem[]): AIConfigFormValues {
  return {
    ai_endpoint: getConfigValue(configs, "ai_endpoint"),
    ai_model: getConfigValue(configs, "ai_model"),
    ai_api_key: getConfigValue(configs, "ai_api_key"),
  };
}

export function getFeishuConfigValues(configs: ConfigItem[]): FeishuConfigFormValues {
  return {
    feishu_app_id: getConfigValue(configs, "feishu_app_id"),
    feishu_app_secret: getConfigValue(configs, "feishu_app_secret"),
    feishu_verification_token: getConfigValue(configs, "feishu_verification_token"),
  };
}

export function getEmailConfigValues(configs: ConfigItem[]): EmailConfigFormValues {
  return {
    smtp_host: getConfigValue(configs, "smtp_host"),
    smtp_port: getConfigValue(configs, "smtp_port", "465"),
    smtp_user: getConfigValue(configs, "smtp_user"),
    smtp_pass: getConfigValue(configs, "smtp_pass"),
    smtp_from: getConfigValue(configs, "smtp_from"),
    smtp_from_name: getConfigValue(configs, "smtp_from_name"),
    admin_email: getConfigValue(configs, "admin_email"),
    email_notify_enabled: getConfigValue(configs, "email_notify_enabled") === "true",
  };
}

export function buildAiConfigItems(values: AIConfigFormValues): ConfigMutationItem[] {
  return [
    { key: "ai_endpoint", value: values.ai_endpoint, description: "AI API 端点地址" },
    { key: "ai_model", value: values.ai_model, description: "AI 模型名称" },
    { key: "ai_api_key", value: values.ai_api_key, description: "AI API 密钥" },
  ];
}

export function buildFeishuConfigItems(values: FeishuConfigFormValues): ConfigMutationItem[] {
  return [
    { key: "feishu_app_id", value: values.feishu_app_id, description: "飞书应用 App ID" },
    { key: "feishu_app_secret", value: values.feishu_app_secret, description: "飞书应用 App Secret" },
    {
      key: "feishu_verification_token",
      value: values.feishu_verification_token,
      description: "飞书事件订阅 Verification Token",
    },
  ];
}

export function buildEmailConfigItems(values: EmailConfigFormValues): ConfigMutationItem[] {
  return [
    { key: "smtp_host", value: values.smtp_host, description: "SMTP 服务器地址" },
    { key: "smtp_port", value: values.smtp_port, description: "SMTP 端口" },
    { key: "smtp_user", value: values.smtp_user, description: "SMTP 用户名" },
    { key: "smtp_pass", value: values.smtp_pass, description: "SMTP 密码" },
    { key: "smtp_from", value: values.smtp_from, description: "发件人邮箱地址" },
    { key: "smtp_from_name", value: values.smtp_from_name || "", description: "发件人名称" },
    { key: "admin_email", value: values.admin_email, description: "管理员邮箱（接收通知）" },
    {
      key: "email_notify_enabled",
      value: values.email_notify_enabled ? "true" : "false",
      description: "是否启用邮件通知",
    },
  ];
}

export function buildSiteConfigItems(values: SiteConfigFormValues): ConfigMutationItem[] {
  return [
    { key: "site_url", value: values.site_url, description: "站点 URL" },
    { key: "site_name", value: values.site_name, description: "站点名称" },
    { key: "site_title", value: values.site_title, description: "浏览器标题" },
    { key: "site_tagline", value: values.site_tagline, description: "站点标语" },
    { key: "site_description", value: values.site_description, description: "站点描述" },
    {
      key: "site_contact_email",
      value: values.site_contact_email,
      description: "站点联系邮箱",
    },
  ];
}

export function filterCustomConfigs(configs: ConfigItem[]) {
  return configs.filter((config) => !RESERVED_CONFIG_KEYS.includes(config.key));
}
