export interface ConfigItem {
  id: number;
  key: string;
  value: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface ConfigMutationItem {
  key: string;
  value: string;
  description: string;
}

export interface ConfigFormValues {
  key: string;
  value: string;
  description?: string;
}

export interface AIConfigFormValues {
  ai_endpoint: string;
  ai_model: string;
  ai_api_key: string;
}

export interface FeishuConfigFormValues {
  feishu_app_id: string;
  feishu_app_secret: string;
  feishu_verification_token: string;
}

export interface EmailConfigFormValues {
  smtp_host: string;
  smtp_port: string;
  smtp_user: string;
  smtp_pass: string;
  smtp_from: string;
  smtp_from_name: string;
  admin_email: string;
  email_notify_enabled: boolean;
}

export interface SiteConfigFormValues {
  site_url: string;
  site_name: string;
  site_title: string;
  site_tagline: string;
  site_description: string;
  site_contact_email: string;
}
