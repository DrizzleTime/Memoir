import { z } from "zod";
import { ARTICLE_STATUS_VALUES } from "@/lib/article-status";

const articleStatusSchema = z.enum(ARTICLE_STATUS_VALUES);

export const userRegisterSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email(),
  password: z.string().min(6).max(100),
  nickname: z.string().max(50).optional(),
});

export const userLoginSchema = z.object({
  username: z.string(),
  password: z.string(),
});

export const installSchema = z.object({
  database: z.object({
    host: z.string().min(1, "请输入数据库地址"),
    port: z.number().int().positive().default(5432),
    name: z.string().min(1, "请输入数据库名"),
    username: z.string().min(1, "请输入数据库用户名"),
    password: z.string(),
    sslMode: z.enum(["disable", "require"]).default("disable"),
  }),
  site: z.object({
    url: z.string().url("请输入有效的站点 URL"),
    name: z.string().min(1, "请输入站点名称").max(80),
    title: z.string().min(1, "请输入站点标题").max(120),
    tagline: z.string().min(1, "请输入站点标语").max(160),
    description: z.string().min(1, "请输入站点描述").max(500),
    contactEmail: z.string().email("请输入有效的联系邮箱"),
  }),
  admin: z.object({
    username: z.string().min(3).max(50),
    email: z.string().email(),
    password: z.string().min(6).max(100),
    nickname: z.string().max(50).optional(),
  }),
});

export const userUpdateSchema = z.object({
  nickname: z.string().max(50).optional(),
  avatar: z.string().max(255).optional(),
  bio: z.string().optional(),
});

export const articleCreateSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string(),
  summary: z.string().max(500).optional(),
  cover_image: z.string().max(255).optional(),
  category_id: z.number().int().nullable().optional(),
  status: articleStatusSchema.default("DRAFT"),
});

export const articleUpdateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.string().optional(),
  summary: z.string().max(500).optional(),
  cover_image: z.string().max(255).optional(),
  category_id: z.number().int().nullable().optional(),
  status: articleStatusSchema.optional(),
});

export const commentTargetTypeSchema = z.enum(["article", "memo"]);

export const commentCreateSchema = z.object({
  content: z.string().min(1),
  target_type: commentTargetTypeSchema,
  target_id: z.number().int().positive(),
  parent_id: z.number().optional().nullable(),
  guest_name: z.string().max(50).optional(),
  guest_email: z.string().email().optional(),
  guest_website: z.string().max(255).optional(),
});

export const commentUpdateSchema = z.object({
  content: z.string().min(1).optional(),
  is_approved: z.boolean().optional(),
});
export type UserRegister = z.infer<typeof userRegisterSchema>;
export type UserLogin = z.infer<typeof userLoginSchema>;
export type UserUpdate = z.infer<typeof userUpdateSchema>;
export type Install = z.infer<typeof installSchema>;
export type ArticleCreate = z.infer<typeof articleCreateSchema>;
export type ArticleUpdate = z.infer<typeof articleUpdateSchema>;
export type CommentCreate = z.infer<typeof commentCreateSchema>;
export type CommentUpdate = z.infer<typeof commentUpdateSchema>;
