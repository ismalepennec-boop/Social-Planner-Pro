import { sql } from "drizzle-orm";
import { pgTable, text, varchar, serial, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  image: text("image"),
  video: text("video"),
  type: text("type").notNull().default("text"),
  date: timestamp("date").notNull(),
  platforms: text("platforms").array().notNull(),
  status: text("status").notNull().default("scheduled"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertPostSchema = createInsertSchema(posts, {
  date: z.coerce.date(),
}).omit({
  id: true,
  createdAt: true,
});

export type InsertPost = z.infer<typeof insertPostSchema>;
export type Post = typeof posts.$inferSelect;
