import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "../../trpc";
import { TRPCError } from "@trpc/server";


export const messageRouter = createTRPCRouter({
  all: publicProcedure.input(z.object({ chatId: z.string() })).query(async ({ ctx, input }) => {
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
    const newMessage = await ctx.prisma.message.create({
      data: { ...input }
    });

    if (!newMessage) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Error al crear el mensaje"
      })
    }

    return newMessage
  }),

});
