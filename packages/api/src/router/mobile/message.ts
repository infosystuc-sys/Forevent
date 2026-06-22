import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createTRPCRouter, mobileProtectedProcedure } from "../../trpc";
import { assertChatParticipant, chatChannelName } from "../../lib/chat-auth";

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
      await assertChatParticipant(ctx.prisma, ctx.user.id, input.chatId);

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

      const chat = await assertChatParticipant(ctx.prisma, ctx.user.id, chatId);

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

      // Parallelizar escritura del mensaje y actualización del chat (era secuencial)
      const [newMessage] = await Promise.all([
        ctx.prisma.message.create({
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
        }),
        ctx.prisma.chat.update({
          where: { id: chatId },
          data: { updatedAt: new Date() },
        }),
      ]);

      // Emit vía WebSocket — canal privado, requiere autorización (ver chat.pusherAuth)
      await ctx.pusher.trigger(chatChannelName(chatId), "new-message", {
        id: newMessage.id,
        chatId,
        requesterId: userOnEvent.id,
        text,
        createdAt: newMessage.createdAt,
        requester: newMessage.requester,
      });

      return newMessage;
    }),

  "delete": mobileProtectedProcedure
    .input(z.object({ messageId: z.string() }))
    .mutation(() => {
      return;
    }),
});
