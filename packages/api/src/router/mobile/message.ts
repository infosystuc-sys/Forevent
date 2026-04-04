import { CreatePostSchema } from "@forevent/validators";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure, publicProcedure } from "../../trpc";
import { TRPCError } from "@trpc/server";
import { io } from "socket.io-client";


export const messageRouter = createTRPCRouter({
  all: publicProcedure.input(z.object({ chatId: z.string() })).query(async ({ ctx, input }) => {
    // return ctx.db.select().from(schema.post).orderBy(desc(schema.post.id));
    const messages = await ctx.prisma.chat.findUnique({
      where: { id: input.chatId },
      select: { messages: { orderBy: { createdAt: "desc" } } }
    })

    if (!messages) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Error al traer mensajes"
      })
    }

    return messages.messages
  }),

  create: publicProcedure.input(z.object({
      text: z.string(),
      requesterId: z.string(),
      chatId: z.string(),
    })).mutation(async ({ ctx, input }) => {
      const { text, requesterId, chatId } = input;

      const chat = await ctx.prisma.chat.findUnique({
        where: { id: chatId },
        select: {
          requester: { select: { userId: true } },
          receiver: { select: { userId: true } },
        },
      });

      if (!chat) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Chat no encontrado' });
      }

      const isParticipant =
        chat.requester.userId === requesterId ||
        chat.receiver.userId === requesterId;

      if (!isParticipant) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'No sos participante de este chat',
        });
      }

      console.log(ctx.socket.active, 'antes')

      const newMessage = await ctx.prisma.message.create({
        data: { text, requesterId, chatId }
      });

      if (!newMessage) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Error al crear el mensaje"
        })
      }

      // ctx.socket.connect()

      return newMessage
    }),

  "delete": protectedProcedure.input(z.number()).mutation(({ ctx, input }) => {
    return
  }),
});
