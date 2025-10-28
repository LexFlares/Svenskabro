import { eq, desc, and, or, like } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, users, 
  bridges, InsertBridge, Bridge,
  jobs, InsertJob, Job,
  deviations, InsertDeviation, Deviation,
  documents, InsertDocument, Document,
  workGroups, InsertWorkGroup, WorkGroup,
  workGroupMembers, InsertWorkGroupMember, WorkGroupMember,
  chatMessages, InsertChatMessage, ChatMessage,
  chatKeys, InsertChatKey, ChatKey
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ============ User Management ============

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod", "phone", "company", "avatarUrl"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(users).orderBy(desc(users.createdAt));
}

export async function updateUserProfile(userId: number, updates: Partial<InsertUser>) {
  const db = await getDb();
  if (!db) return null;
  
  await db.update(users).set(updates).where(eq(users.id, userId));
  const result = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  return result[0] || null;
}

// ============ Bridges ============

export async function getAllBridges() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(bridges).orderBy(bridges.name);
}

export async function getBridgeById(id: string) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(bridges).where(eq(bridges.id, id)).limit(1);
  return result[0] || null;
}

export async function searchBridges(query: string) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(bridges)
    .where(or(
      like(bridges.name, `%${query}%`),
      like(bridges.id, `%${query}%`),
      like(bridges.description, `%${query}%`)
    ))
    .orderBy(bridges.name);
}

export async function createBridge(bridge: InsertBridge) {
  const db = await getDb();
  if (!db) return null;
  
  await db.insert(bridges).values(bridge);
  return await getBridgeById(bridge.id);
}

export async function importBridges(bridgeList: InsertBridge[]) {
  const db = await getDb();
  if (!db) return 0;
  
  for (const bridge of bridgeList) {
    await db.insert(bridges).values(bridge).onDuplicateKeyUpdate({
      set: {
        name: bridge.name,
        description: bridge.description,
        x: bridge.x,
        y: bridge.y,
        taPlanUrl: bridge.taPlanUrl,
        updatedAt: new Date(),
      }
    });
  }
  
  return bridgeList.length;
}

// ============ Jobs ============

export async function getAllJobs() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(jobs).orderBy(desc(jobs.startTid));
}

export async function getJobsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(jobs).where(eq(jobs.userId, userId)).orderBy(desc(jobs.startTid));
}

export async function createJob(job: InsertJob) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.insert(jobs).values(job);
  const insertId = Number(result[0].insertId);
  const created = await db.select().from(jobs).where(eq(jobs.id, insertId)).limit(1);
  return created[0] || null;
}

export async function updateJob(id: number, updates: Partial<InsertJob>) {
  const db = await getDb();
  if (!db) return null;
  
  await db.update(jobs).set(updates).where(eq(jobs.id, id));
  const result = await db.select().from(jobs).where(eq(jobs.id, id)).limit(1);
  return result[0] || null;
}

export async function deleteJob(id: number) {
  const db = await getDb();
  if (!db) return false;
  
  await db.delete(jobs).where(eq(jobs.id, id));
  return true;
}

// ============ Deviations ============

export async function getAllDeviations() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(deviations).orderBy(desc(deviations.createdAt));
}

export async function getDeviationsByJobId(jobId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(deviations).where(eq(deviations.jobId, jobId)).orderBy(desc(deviations.createdAt));
}

export async function createDeviation(deviation: InsertDeviation) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.insert(deviations).values(deviation);
  const insertId = Number(result[0].insertId);
  const created = await db.select().from(deviations).where(eq(deviations.id, insertId)).limit(1);
  return created[0] || null;
}

export async function updateDeviation(id: number, updates: Partial<InsertDeviation>) {
  const db = await getDb();
  if (!db) return null;
  
  await db.update(deviations).set(updates).where(eq(deviations.id, id));
  const result = await db.select().from(deviations).where(eq(deviations.id, id)).limit(1);
  return result[0] || null;
}

// ============ Documents ============

export async function getAllDocuments() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(documents).orderBy(desc(documents.createdAt));
}

export async function getDocumentsByCategory(category: string) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(documents).where(eq(documents.category, category as any)).orderBy(desc(documents.createdAt));
}

export async function createDocument(document: InsertDocument) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.insert(documents).values(document);
  const insertId = Number(result[0].insertId);
  const created = await db.select().from(documents).where(eq(documents.id, insertId)).limit(1);
  return created[0] || null;
}

export async function deleteDocument(id: number) {
  const db = await getDb();
  if (!db) return false;
  
  await db.delete(documents).where(eq(documents.id, id));
  return true;
}

// ============ Work Groups ============

export async function getAllWorkGroups() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(workGroups).orderBy(desc(workGroups.createdAt));
}

export async function getWorkGroupByInviteCode(inviteCode: string) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(workGroups).where(eq(workGroups.inviteCode, inviteCode)).limit(1);
  return result[0] || null;
}

export async function createWorkGroup(group: InsertWorkGroup) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.insert(workGroups).values(group);
  const insertId = Number(result[0].insertId);
  const created = await db.select().from(workGroups).where(eq(workGroups.id, insertId)).limit(1);
  return created[0] || null;
}

export async function getWorkGroupMembers(groupId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const members = await db.select({
    id: workGroupMembers.id,
    workGroupId: workGroupMembers.workGroupId,
    userId: workGroupMembers.userId,
    joinedAt: workGroupMembers.joinedAt,
    userName: users.name,
    userEmail: users.email,
  })
  .from(workGroupMembers)
  .leftJoin(users, eq(workGroupMembers.userId, users.id))
  .where(eq(workGroupMembers.workGroupId, groupId))
  .orderBy(workGroupMembers.joinedAt);
  
  return members;
}

export async function addWorkGroupMember(member: InsertWorkGroupMember) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.insert(workGroupMembers).values(member);
  const insertId = Number(result[0].insertId);
  const created = await db.select().from(workGroupMembers).where(eq(workGroupMembers.id, insertId)).limit(1);
  return created[0] || null;
}

export async function getUserWorkGroups(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const groups = await db.select({
    id: workGroups.id,
    name: workGroups.name,
    inviteCode: workGroups.inviteCode,
    createdBy: workGroups.createdBy,
    createdAt: workGroups.createdAt,
  })
  .from(workGroupMembers)
  .leftJoin(workGroups, eq(workGroupMembers.workGroupId, workGroups.id))
  .where(eq(workGroupMembers.userId, userId))
  .orderBy(desc(workGroups.createdAt));
  
  return groups;
}

// ============ Chat Messages ============

export async function getChatMessages(chatId: string, limit: number = 100) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(chatMessages)
    .where(eq(chatMessages.chatId, chatId))
    .orderBy(desc(chatMessages.createdAt))
    .limit(limit);
}

export async function createChatMessage(message: InsertChatMessage) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.insert(chatMessages).values(message);
  const insertId = Number(result[0].insertId);
  const created = await db.select().from(chatMessages).where(eq(chatMessages.id, insertId)).limit(1);
  return created[0] || null;
}

export async function getUserChats(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  // Get unique chat IDs where user is sender or recipient
  const chats = await db.select({
    chatId: chatMessages.chatId,
    lastMessage: chatMessages.content,
    lastMessageAt: chatMessages.createdAt,
  })
  .from(chatMessages)
  .where(or(
    eq(chatMessages.senderId, userId),
    eq(chatMessages.recipientId, userId)
  ))
  .orderBy(desc(chatMessages.createdAt))
  .limit(50);
  
  return chats;
}

// ============ Chat Keys ============

export async function getChatKey(chatId: string) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(chatKeys).where(eq(chatKeys.chatId, chatId)).limit(1);
  return result[0] || null;
}

export async function createChatKey(key: InsertChatKey) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.insert(chatKeys).values(key);
  const insertId = Number(result[0].insertId);
  const created = await db.select().from(chatKeys).where(eq(chatKeys.id, insertId)).limit(1);
  return created[0] || null;
}

