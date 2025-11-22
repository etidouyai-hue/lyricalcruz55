import { z } from "zod";
import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";

// Poem data structure
export interface Poem {
  slug: string;
  title: string;
  date: string;
  category: string;
  excerpt: string;
  poem: string[];
}

// Supabase Like schema
export interface Like {
  post_slug: string;
  count: number;
  updated_at: string;
}

// Supabase Review schema
export interface Review {
  id: string;
  post_slug: string;
  name: string;
  email: string | null;
  rating: number;
  comment: string;
  created_at: string;
}

// Contact message schema
export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  message: string;
  created_at: string;
}

// Admin User schema
export interface AdminUser {
  id: string;
  email: string;
  name: string;
  status: 'pending' | 'approved' | 'rejected';
  role: 'super_admin' | 'admin';
  requested_at: string;
  approved_at: string | null;
  approved_by: string | null;
}

// Validation schemas
export const insertReviewSchema = z.object({
  post_slug: z.string().min(1),
  name: z.string().min(1).max(100),
  email: z.string().email().optional().nullable(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(1).max(1000),
});

export type InsertReview = z.infer<typeof insertReviewSchema>;

// Contact form schema
export const insertContactSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  message: z.string().min(1).max(2000),
});

export type InsertContact = z.infer<typeof insertContactSchema>;

// Poem creation schema
export const insertPoemSchema = z.object({
  title: z.string().min(1).max(200),
  category: z.enum(["Love", "Life", "Family", "Modern Life", "Nature"]),
  excerpt: z.string().min(1).max(500),
  poem: z.array(z.string()).min(1).max(100),
});

export type InsertPoem = z.infer<typeof insertPoemSchema>;

// Admin user request schema
export const adminRequestSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  message: z.string().min(1).max(500).optional(),
});

export type AdminRequest = z.infer<typeof adminRequestSchema>;

// Database Tables
export const adminUsers = pgTable("admin_users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  status: text("status", { enum: ["pending", "approved", "rejected"] }).notNull().default("pending"),
  role: text("role", { enum: ["super_admin", "admin"] }).notNull().default("admin"),
  message: text("message"),
  requestedAt: timestamp("requested_at").notNull().defaultNow(),
  approvedAt: timestamp("approved_at"),
  approvedBy: text("approved_by"),
});

export const insertAdminUserSchema = createInsertSchema(adminUsers).omit({
  id: true,
  requestedAt: true,
  approvedAt: true,
  approvedBy: true,
  status: true,
  role: true,
});

export type InsertAdminUser = z.infer<typeof insertAdminUserSchema>;
export type AdminUserDb = typeof adminUsers.$inferSelect;

// Categories for filtering
export const POEM_CATEGORIES = ["All", "Love", "Life", "Family", "Modern Life", "Nature"] as const;
export type PoemCategory = typeof POEM_CATEGORIES[number];
