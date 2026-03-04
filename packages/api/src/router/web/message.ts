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
    // const { text, requesterId, chatId } = input;
    console.log(ctx.socket.active, 'antes')

    const newMessage = await ctx.prisma.message.create({
      data: { ...input }
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

});
