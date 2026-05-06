import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createTRPCRouter, mobileProtectedProcedure } from "../../trpc";

export const chatRouter = createTRPCRouter({
  /**
   * List all chats (DMs + channels) for the authenticated user in an event.
   * Channels are returned first, then DMs sorted by last activity.
   */
  all: mobileProtectedProcedure
    .input(z.object({ eventId: z.string() }))
    .query(async ({ input, ctx }) => {
      const userOnEvent = await ctx.prisma.userOnEvent.findFirst({
        where: { userId: ctx.user.id, eventId: input.eventId, discharged: true },
      });

      if (!userOnEvent) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No estás registrado en este evento.",
        });
      }

      const readCursors = await ctx.prisma.chatReadCursor.findMany({
        where: { userId: ctx.user.id },
        select: { chatId: true, lastReadAt: true },
      });
      const cursorMap = new Map(readCursors.map((c) => [c.chatId, c.lastReadAt]));

      const chats = await ctx.prisma.chat.findMany({
        where: {
          eventId: input.eventId,
          discharged: true,
          NOT: { status: "REJECTED" },
          OR: [
            { type: "DM", requesterId: userOnEvent.id },
            { type: "DM", receiverId: userOnEvent.id },
            { type: "CHANNEL", participants: { some: { userId: ctx.user.id } } },
          ],
        },
        orderBy: { updatedAt: "desc" },
        select: {
          id: true,
          type: true,
          name: true,
          image: true,
          createdAt: true,
          updatedAt: true,
          receiver: {
            select: { user: { select: { id: true, image: true, name: true } } },
          },
          requester: {
            select: { user: { select: { id: true, image: true, name: true } } },
          },
          messages: {
            orderBy: { createdAt: "desc" },
            take: 1,
            select: {
              text: true,
              createdAt: true,
              requester: { select: { user: { select: { id: true, name: true } } } },
            },
          },
          _count: { select: { participants: true, messages: true } },
        },
      });

      // Compute unread count per chat
      return chats.map((chat) => {
        const lastRead = cursorMap.get(chat.id) ?? new Date(0);
        const lastMsg = chat.messages[0];
        const hasUnread =
          lastMsg &&
          lastMsg.createdAt > lastRead &&
          lastMsg.requester.user.id !== ctx.user.id;

        return {
          ...chat,
          unreadCount: hasUnread ? 1 : 0, // simplified: 1 = has unread, 0 = read
        };
      });
    }),

  /**
   * Get a single chat by ID. Verifies the user is a participant.
   */
  byId: mobileProtectedProcedure
    .input(z.object({ chatId: z.string() }))
    .query(async ({ ctx, input }) => {
      const chat = await ctx.prisma.chat.findUnique({
        where: { id: input.chatId, discharged: true },
        select: {
          id: true,
          type: true,
          name: true,
          image: true,
          createdAt: true,
          status: true,
          eventId: true,
          event: { select: { id: true, name: true, image: true } },
          requester: {
            select: {
              user: { select: { id: true, name: true, image: true, email: true } },
            },
          },
          requesterId: true,
          receiver: {
            select: {
              user: { select: { id: true, name: true, image: true, email: true } },
            },
          },
          receiverId: true,
          _count: { select: { participants: true } },
        },
      });

      if (!chat) {
        throw new TRPCError({ code: "NOT_FOUND", message: "El chat no existe." });
      }

      // Authorization: verify user is a participant
      const isRequester = chat.requester?.user.id === ctx.user.id;
      const isReceiver = chat.receiver?.user.id === ctx.user.id;
      if (chat.type === "DM" && !isRequester && !isReceiver) {
        throw new TRPCError({ code: "FORBIDDEN", message: "No tenés acceso a este chat." });
      }
      if (chat.type === "CHANNEL") {
        const participant = await ctx.prisma.chatParticipant.findUnique({
          where: { chatId_userId: { chatId: chat.id, userId: ctx.user.id } },
        });
        if (!participant) {
          throw new TRPCError({ code: "FORBIDDEN", message: "No formas parte de este canal." });
        }
      }

      return chat;
    }),

  /**
   * Create a new DM between the authenticated user and another user in the same event.
   */
  create: mobileProtectedProcedure
    .input(
      z.object({
        receiverId: z.string(), // User.id of the other person
        eventId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const requester = await ctx.prisma.userOnEvent.findFirst({
        where: { userId: ctx.user.id, eventId: input.eventId, discharged: true },
      });

      if (!requester) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No estás registrado en este evento.",
        });
      }

      const receiver = await ctx.prisma.userOnEvent.findFirst({
        where: { userId: input.receiverId, eventId: input.eventId, discharged: true },
      });

      if (!receiver) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "El usuario no está registrado en este evento.",
        });
      }

      // Check if a DM already exists between these two users in this event
      const exists = await ctx.prisma.chat.findFirst({
        where: {
          type: "DM",
          eventId: input.eventId,
          OR: [
            { requesterId: requester.id, receiverId: receiver.id },
            { requesterId: receiver.id, receiverId: requester.id },
          ],
        },
      });

      if (exists) {
        ctx.socket.connect();
        ctx.socket.emit("login", { chatId: exists.id, name: requester.id });
        ctx.socket.disconnect();
        throw new TRPCError({ code: "CONFLICT", message: exists.id });
      }

      const chat = await ctx.prisma.chat.create({
        data: {
          type: "DM",
          requesterId: requester.id,
          receiverId: receiver.id,
          eventId: input.eventId,
        },
      });

      ctx.socket.connect();
      ctx.socket.emit("login", { chatId: chat.id, name: requester.id });
      ctx.socket.disconnect();

      return chat.id;
    }),

  /**
   * Get or create the event channel. Auto-joins the user as participant.
   */
  eventChannel: mobileProtectedProcedure
    .input(z.object({ eventId: z.string() }))
    .query(async ({ ctx, input }) => {
      const userOnEvent = await ctx.prisma.userOnEvent.findFirst({
        where: { userId: ctx.user.id, eventId: input.eventId, discharged: true },
      });

      if (!userOnEvent) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "No formas parte de este evento.",
        });
      }

      let channel = await ctx.prisma.chat.findFirst({
        where: { eventId: input.eventId, type: "CHANNEL" },
        select: {
          id: true,
          name: true,
          image: true,
          _count: { select: { participants: true } },
        },
      });

      if (!channel) {
        const event = await ctx.prisma.event.findUnique({
          where: { id: input.eventId },
          select: { name: true, image: true },
        });

        const created = await ctx.prisma.chat.create({
          data: {
            eventId: input.eventId,
            type: "CHANNEL",
            name: event?.name ?? "Canal del evento",
            image: event?.image,
          },
          select: {
            id: true,
            name: true,
            image: true,
            _count: { select: { participants: true } },
          },
        });
        channel = created;
      }

      // Auto-join the user as participant
      await ctx.prisma.chatParticipant.upsert({
        where: { chatId_userId: { chatId: channel.id, userId: ctx.user.id } },
        update: {},
        create: { chatId: channel.id, userId: ctx.user.id },
      });

      return channel;
    }),

  /**
   * Mark a chat as read for the authenticated user.
   */
  markRead: mobileProtectedProcedure
    .input(z.object({ chatId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.chatReadCursor.upsert({
        where: { chatId_userId: { chatId: input.chatId, userId: ctx.user.id } },
        update: { lastReadAt: new Date() },
        create: { chatId: input.chatId, userId: ctx.user.id },
      });
      return { success: true };
    }),

  /**
   * Get total unread count across all chats for an event.
   */
  unreadCount: mobileProtectedProcedure
    .input(z.object({ eventId: z.string() }))
    .query(async ({ ctx, input }) => {
      const userOnEvent = await ctx.prisma.userOnEvent.findFirst({
        where: { userId: ctx.user.id, eventId: input.eventId, discharged: true },
      });

      if (!userOnEvent) return { count: 0 };

      const readCursors = await ctx.prisma.chatReadCursor.findMany({
        where: { userId: ctx.user.id },
        select: { chatId: true, lastReadAt: true },
      });
      const cursorMap = new Map(readCursors.map((c) => [c.chatId, c.lastReadAt]));

      const chats = await ctx.prisma.chat.findMany({
        where: {
          eventId: input.eventId,
          discharged: true,
          NOT: { status: "REJECTED" },
          OR: [
            { type: "DM", requesterId: userOnEvent.id },
            { type: "DM", receiverId: userOnEvent.id },
            { type: "CHANNEL", participants: { some: { userId: ctx.user.id } } },
          ],
        },
        select: {
          id: true,
          messages: {
            orderBy: { createdAt: "desc" },
            take: 1,
            select: {
              createdAt: true,
              requester: { select: { user: { select: { id: true } } } },
            },
          },
        },
      });

      let count = 0;
      for (const chat of chats) {
        const lastRead = cursorMap.get(chat.id) ?? new Date(0);
        const lastMsg = chat.messages[0];
        if (lastMsg && lastMsg.createdAt > lastRead && lastMsg.requester.user.id !== ctx.user.id) {
          count++;
        }
      }

      return { count };
    }),

  "delete": mobileProtectedProcedure
    .input(z.object({ chatId: z.string() }))
    .mutation(() => {
      return;
    }),
});
