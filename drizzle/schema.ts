import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, decimal } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin", "employee"]).default("employee").notNull(),
  phone: varchar("phone", { length: 20 }),
  company: text("company"),
  avatarUrl: text("avatarUrl"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Bridges table - stores bridge information
 */
export const bridges = mysqlTable("bridges", {
  id: varchar("id", { length: 100 }).primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  x: varchar("x", { length: 50 }).notNull(), // Longitude as string
  y: varchar("y", { length: 50 }).notNull(), // Latitude as string
  taPlanUrl: text("taPlanUrl"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Bridge = typeof bridges.$inferSelect;
export type InsertBridge = typeof bridges.$inferInsert;

/**
 * Jobs table - work assignments for bridges
 */
export const jobs = mysqlTable("jobs", {
  id: int("id").autoincrement().primaryKey(),
  bridgeId: varchar("bridgeId", { length: 100 }),
  bridgeName: text("bridgeName").notNull(),
  userId: int("userId").notNull(),
  userName: text("userName").notNull(),
  startTid: timestamp("startTid").notNull(),
  slutTid: timestamp("slutTid"),
  beskrivning: text("beskrivning"),
  status: mysqlEnum("status", ["pågående", "avslutad"]).default("pågående").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Job = typeof jobs.$inferSelect;
export type InsertJob = typeof jobs.$inferInsert;

/**
 * Deviations table - issue reporting
 */
export const deviations = mysqlTable("deviations", {
  id: int("id").autoincrement().primaryKey(),
  jobId: int("jobId"),
  bridgeId: varchar("bridgeId", { length: 100 }),
  bridgeName: text("bridgeName").notNull(),
  userId: int("userId").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  severity: mysqlEnum("severity", ["low", "medium", "high", "critical"]).default("medium").notNull(),
  status: mysqlEnum("status", ["open", "in_progress", "resolved", "closed"]).default("open").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Deviation = typeof deviations.$inferSelect;
export type InsertDeviation = typeof deviations.$inferInsert;

/**
 * Documents table - file storage references
 */
export const documents = mysqlTable("documents", {
  id: int("id").autoincrement().primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  fileUrl: text("fileUrl").notNull(),
  fileKey: text("fileKey").notNull(),
  fileType: varchar("fileType", { length: 100 }).notNull(),
  category: mysqlEnum("category", ["kma", "general", "safety", "technical"]).default("general").notNull(),
  uploadedBy: int("uploadedBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Document = typeof documents.$inferSelect;
export type InsertDocument = typeof documents.$inferInsert;

/**
 * Work groups table
 */
export const workGroups = mysqlTable("workGroups", {
  id: int("id").autoincrement().primaryKey(),
  name: text("name").notNull(),
  inviteCode: varchar("inviteCode", { length: 20 }).notNull().unique(),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type WorkGroup = typeof workGroups.$inferSelect;
export type InsertWorkGroup = typeof workGroups.$inferInsert;

/**
 * Work group members table
 */
export const workGroupMembers = mysqlTable("workGroupMembers", {
  id: int("id").autoincrement().primaryKey(),
  workGroupId: int("workGroupId").notNull(),
  userId: int("userId").notNull(),
  joinedAt: timestamp("joinedAt").defaultNow().notNull(),
});

export type WorkGroupMember = typeof workGroupMembers.$inferSelect;
export type InsertWorkGroupMember = typeof workGroupMembers.$inferInsert;

/**
 * Chat messages table - supports encrypted messaging
 */
export const chatMessages = mysqlTable("chatMessages", {
  id: int("id").autoincrement().primaryKey(),
  chatId: varchar("chatId", { length: 100 }).notNull(),
  senderId: int("senderId").notNull(),
  recipientId: int("recipientId"),
  workGroupId: int("workGroupId"),
  content: text("content").notNull(),
  isEncrypted: boolean("isEncrypted").default(true).notNull(),
  messageType: mysqlEnum("messageType", ["text", "image", "file", "voice"]).default("text").notNull(),
  attachmentUrl: text("attachmentUrl"),
  attachmentKey: text("attachmentKey"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = typeof chatMessages.$inferInsert;

/**
 * Chat encryption keys table - stores encryption keys per chat
 */
export const chatKeys = mysqlTable("chatKeys", {
  id: int("id").autoincrement().primaryKey(),
  chatId: varchar("chatId", { length: 100 }).notNull().unique(),
  encryptionKey: text("encryptionKey").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ChatKey = typeof chatKeys.$inferSelect;
export type InsertChatKey = typeof chatKeys.$inferInsert;

