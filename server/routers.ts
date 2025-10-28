import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { TRPCError } from "@trpc/server";

// Admin-only procedure
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'admin') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
  }
  return next({ ctx });
});

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  users: router({
    getAll: protectedProcedure.query(async () => {
      return await db.getAllUsers();
    }),
    
    updateProfile: protectedProcedure
      .input(z.object({
        name: z.string().optional(),
        phone: z.string().optional(),
        company: z.string().optional(),
        avatarUrl: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return await db.updateUserProfile(ctx.user.id, input);
      }),
  }),

  bridges: router({
    getAll: publicProcedure.query(async () => {
      return await db.getAllBridges();
    }),
    
    getById: publicProcedure
      .input(z.object({ id: z.string() }))
      .query(async ({ input }) => {
        return await db.getBridgeById(input.id);
      }),
    
    search: publicProcedure
      .input(z.object({ query: z.string() }))
      .query(async ({ input }) => {
        return await db.searchBridges(input.query);
      }),
    
    create: protectedProcedure
      .input(z.object({
        id: z.string(),
        name: z.string(),
        description: z.string().optional(),
        x: z.string(),
        y: z.string(),
        taPlanUrl: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return await db.createBridge(input);
      }),
    
    import: adminProcedure
      .input(z.object({
        bridges: z.array(z.object({
          id: z.string(),
          name: z.string(),
          description: z.string().optional(),
          x: z.string(),
          y: z.string(),
          taPlanUrl: z.string().optional(),
        }))
      }))
      .mutation(async ({ input }) => {
        return await db.importBridges(input.bridges);
      }),
  }),

  jobs: router({
    getAll: adminProcedure.query(async () => {
      return await db.getAllJobs();
    }),
    
    getMine: protectedProcedure.query(async ({ ctx }) => {
      return await db.getJobsByUserId(ctx.user.id);
    }),
    
    create: protectedProcedure
      .input(z.object({
        bridgeId: z.string().optional(),
        bridgeName: z.string(),
        startTid: z.date(),
        beskrivning: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return await db.createJob({
          ...input,
          userId: ctx.user.id,
          userName: ctx.user.name || ctx.user.email || 'Unknown',
          status: 'pågående',
        });
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        slutTid: z.date().optional(),
        beskrivning: z.string().optional(),
        status: z.enum(['pågående', 'avslutad']).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...updates } = input;
        
        // Verify ownership
        const job = await db.getJobsByUserId(ctx.user.id);
        const isOwner = job.some(j => j.id === id);
        const isAdmin = ctx.user.role === 'admin';
        
        if (!isOwner && !isAdmin) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Not authorized to update this job' });
        }
        
        return await db.updateJob(id, updates);
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        // Verify ownership
        const job = await db.getJobsByUserId(ctx.user.id);
        const isOwner = job.some(j => j.id === input.id);
        const isAdmin = ctx.user.role === 'admin';
        
        if (!isOwner && !isAdmin) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Not authorized to delete this job' });
        }
        
        return await db.deleteJob(input.id);
      }),
  }),

  deviations: router({
    getAll: adminProcedure.query(async () => {
      return await db.getAllDeviations();
    }),
    
    getByJob: protectedProcedure
      .input(z.object({ jobId: z.number() }))
      .query(async ({ input }) => {
        return await db.getDeviationsByJobId(input.jobId);
      }),
    
    create: protectedProcedure
      .input(z.object({
        jobId: z.number().optional(),
        bridgeId: z.string().optional(),
        bridgeName: z.string(),
        title: z.string(),
        description: z.string(),
        severity: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
      }))
      .mutation(async ({ ctx, input }) => {
        return await db.createDeviation({
          ...input,
          userId: ctx.user.id,
          status: 'open',
        });
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(['open', 'in_progress', 'resolved', 'closed']).optional(),
        severity: z.enum(['low', 'medium', 'high', 'critical']).optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...updates } = input;
        return await db.updateDeviation(id, updates);
      }),
  }),

  documents: router({
    getAll: publicProcedure.query(async () => {
      return await db.getAllDocuments();
    }),
    
    getByCategory: publicProcedure
      .input(z.object({ category: z.string() }))
      .query(async ({ input }) => {
        return await db.getDocumentsByCategory(input.category);
      }),
    
    create: protectedProcedure
      .input(z.object({
        title: z.string(),
        description: z.string().optional(),
        fileUrl: z.string(),
        fileKey: z.string(),
        fileType: z.string(),
        category: z.enum(['kma', 'general', 'safety', 'technical']).default('general'),
      }))
      .mutation(async ({ ctx, input }) => {
        return await db.createDocument({
          ...input,
          uploadedBy: ctx.user.id,
        });
      }),
    
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return await db.deleteDocument(input.id);
      }),
  }),

  workGroups: router({
    getAll: protectedProcedure.query(async () => {
      return await db.getAllWorkGroups();
    }),
    
    getMine: protectedProcedure.query(async ({ ctx }) => {
      return await db.getUserWorkGroups(ctx.user.id);
    }),
    
    getByInviteCode: protectedProcedure
      .input(z.object({ inviteCode: z.string() }))
      .query(async ({ input }) => {
        return await db.getWorkGroupByInviteCode(input.inviteCode);
      }),
    
    create: protectedProcedure
      .input(z.object({
        name: z.string(),
        inviteCode: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const group = await db.createWorkGroup({
          ...input,
          createdBy: ctx.user.id,
        });
        
        // Auto-add creator as member
        if (group) {
          await db.addWorkGroupMember({
            workGroupId: group.id,
            userId: ctx.user.id,
          });
        }
        
        return group;
      }),
    
    getMembers: protectedProcedure
      .input(z.object({ groupId: z.number() }))
      .query(async ({ input }) => {
        return await db.getWorkGroupMembers(input.groupId);
      }),
    
    join: protectedProcedure
      .input(z.object({ inviteCode: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const group = await db.getWorkGroupByInviteCode(input.inviteCode);
        if (!group) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Work group not found' });
        }
        
        return await db.addWorkGroupMember({
          workGroupId: group.id,
          userId: ctx.user.id,
        });
      }),
  }),

  chat: router({
    getMessages: protectedProcedure
      .input(z.object({ 
        chatId: z.string(),
        limit: z.number().default(100),
      }))
      .query(async ({ input }) => {
        return await db.getChatMessages(input.chatId, input.limit);
      }),
    
    sendMessage: protectedProcedure
      .input(z.object({
        chatId: z.string(),
        recipientId: z.number().optional(),
        workGroupId: z.number().optional(),
        content: z.string(),
        isEncrypted: z.boolean().default(true),
        messageType: z.enum(['text', 'image', 'file', 'voice']).default('text'),
        attachmentUrl: z.string().optional(),
        attachmentKey: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return await db.createChatMessage({
          ...input,
          senderId: ctx.user.id,
        });
      }),
    
    getUserChats: protectedProcedure.query(async ({ ctx }) => {
      return await db.getUserChats(ctx.user.id);
    }),
    
    getChatKey: protectedProcedure
      .input(z.object({ chatId: z.string() }))
      .query(async ({ input }) => {
        return await db.getChatKey(input.chatId);
      }),
    
    createChatKey: protectedProcedure
      .input(z.object({
        chatId: z.string(),
        encryptionKey: z.string(),
      }))
      .mutation(async ({ input }) => {
        return await db.createChatKey(input);
      }),
  }),
});

export type AppRouter = typeof appRouter;

