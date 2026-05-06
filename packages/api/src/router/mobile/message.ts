import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createTRPCRouter, mobileProtectedProcedure } from "../../trpc";

export const messageRouter = createTRPCRouter({
  /**
   * Paginated messages for a chat. Cursor-based, newest first.
   */
  all: mobileProtectedProcedure
    .input(
      z.object({
        chatId: z.string(),
        cursor: z.string().optional(),
        limit: z.number().min(1).max(100).default(30),
      })
    )
    .query(async ({ ctx, input }) => {
      // Verify the user has access to this chat
      const chat = await ctx.prisma.chat.findUnique({
        where: { id: input.chatId },
        select: {
          type: true,
          eventId: true,
          requester: { select: { userId: true } },
          receiver: { select: { userId: true } },
        },
      });

      if (!chat) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Chat no encontrado." });
      }

      if (chat.type === "DM") {
        const isParticipant =
          chat.requester?.userId === ctx.user.id ||
          chat.receiver?.userId === ctx.user.id;
        if (!isParticipant) {
          throw new TRPCError({ code: "FORBIDDEN", message: "No tenés acceso a este chat." });
        }
      } else {
        const participant = await ctx.prisma.chatParticipant.findUnique({
          where: { chatId_userId: { chatId: input.chatId, userId: ctx.user.id } },
        });
        if (!participant) {
          throw new TRPCError({ code: "FORBIDDEN", message: "No formas parte de este canal." });
        }
      }

      const messages = await ctx.prisma.message.findMany({
        where: { chatId: input.chatId },
        orderBy: { createdAt: "desc" },
        take: input.limit + 1,
        ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
        select: {
          id: true,
          text: true,
          createdAt: true,
          requesterId: true,
          requester: {
            select: {
              user: { select: { id: true, name: true, image: true } },
            },
          },
        },
      });

      const hasMore = messages.length > input.limit;
      const items = hasMore ? messages.slice(0, -1) : messages;

      return {
        items,
        nextCursor: hasMore ? items[items.length - 1]?.id : undefined,
      };
    }),

  /**
   * Send a message in a chat. Verifies participant, resolves UserOnEvent,
   * persists to DB, and emits via WebSocket.
   */
  create: mobileProtectedProcedure
    .input(
      z.object({
        text: z.string().min(1),
        chatId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { text, chatId } = input;

      const chat = await ctx.prisma.chat.findUnique({
        where: { id: chatId },
        select: {
          type: true,
          eventId: true,
          requester: { select: { userId: true } },
          receiver: { select: { userId: true } },
        },
      });

      if (!chat) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Chat no encontrado." });
      }

      // Authorization check
      if (chat.type === "DM") {
        const isParticipant =
          chat.requester?.userId === ctx.user.id ||
          chat.receiver?.userId === ctx.user.id;
        if (!isParticipant) {
          throw new TRPCError({ code: "FORBIDDEN", message: "No sos participante de este chat." });
        }
      } else {
        const participant = await ctx.prisma.chatParticipant.findUnique({
          where: { chatId_userId: { chatId, userId: ctx.user.id } },
        });
        if (!participant) {
          throw new TRPCError({ code: "FORBIDDEN", message: "No formas parte de este canal." });
        }
      }

      // Resolve the correct UserOnEvent.id for the FK
      const userOnEvent = await ctx.prisma.userOnEvent.findFirst({
        where: { userId: ctx.user.id, eventId: chat.eventId, discharged: true },
      });

      if (!userOnEvent) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No estás registrado en este evento.",
        });
      }

      const newMessage = await ctx.prisma.message.create({
        data: { text, requesterId: userOnEvent.id, chatId },
        select: {
          id: true,
          text: true,
          createdAt: true,
          requesterId: true,
          requester: {
            select: {
              user: { select: { id: true, name: true, image: true } },
            },
          },
        },
      });

      // Update chat.updatedAt so it sorts to top of chat list
      await ctx.prisma.chat.update({
        where: { id: chatId },
        data: { updatedAt: new Date() },
      });

      // Emit via WebSocket for real-time delivery
      ctx.socket.connect();
      ctx.socket.emit("sendMessage", {
        chatId,
        requesterId: userOnEvent.id,
        text,
        id: newMessage.id,
        createdAt: newMessage.createdAt,
        requester: newMessage.requester,
      });
      ctx.socket.disconnect();

      return newMessage;
    }),

  "delete": mobileProtectedProcedure
    .input(z.object({ messageId: z.string() }))
    .mutation(() => {
      return;
    }),
});
