import { sql } from "drizzle-orm";
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Admin users table
export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Application settings
export const settings = sqliteTable("settings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  websiteUrl: text("website_url").notNull(),
  openaiApiKey: text("openai_api_key").notNull(),
  industry: text("industry"),
  blogTone: text("blog_tone").default("professional"),
  publishMethod: text("publish_method").default("manual"), // manual, wordpress, webhook
  wordpressUrl: text("wordpress_url"),
  wordpressUsername: text("wordpress_username"),
  wordpressAppPassword: text("wordpress_app_password"),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
});

export const insertSettingsSchema = createInsertSchema(settings).omit({
  id: true,
  updatedAt: true,
});

export type InsertSettings = z.infer<typeof insertSettingsSchema>;
export type Settings = typeof settings.$inferSelect;

// Blog posts
export const blogPosts = sqliteTable("blog_posts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  content: text("content").notNull(),
  excerpt: text("excerpt"),
  status: text("status").notNull().default("draft"), // draft, scheduled, published
  scheduledFor: integer("scheduled_for", { mode: "timestamp" }),
  publishedAt: integer("published_at", { mode: "timestamp" }),
  topic: text("topic"),
  keywords: text("keywords"), // JSON array stored as string
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
});

export const insertBlogPostSchema = createInsertSchema(blogPosts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertBlogPost = z.infer<typeof insertBlogPostSchema>;
export type BlogPost = typeof blogPosts.$inferSelect;

// Generation history
export const generationHistory = sqliteTable("generation_history", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  topic: text("topic").notNull(),
  prompt: text("prompt").notNull(),
  response: text("response"),
  tokensUsed: integer("tokens_used"),
  cost: text("cost"), // stored as string to preserve decimal precision
  status: text("status").notNull(), // success, error
  errorMessage: text("error_message"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
});

export const insertGenerationHistorySchema = createInsertSchema(generationHistory).omit({
  id: true,
  createdAt: true,
});

export type InsertGenerationHistory = z.infer<typeof insertGenerationHistorySchema>;
export type GenerationHistory = typeof generationHistory.$inferSelect;

// License activation
export const license = sqliteTable("license", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull(),
  licenseKey: text("license_key").notNull(),
  deviceFingerprint: text("device_fingerprint").notNull(),
  activatedAt: integer("activated_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  lastValidatedAt: integer("last_validated_at", { mode: "timestamp" }),
  status: text("status").notNull().default("active"), // active, invalid, expired
});

export const insertLicenseSchema = createInsertSchema(license).omit({
  id: true,
  activatedAt: true,
});

export type InsertLicense = z.infer<typeof insertLicenseSchema>;
export type License = typeof license.$inferSelect;
