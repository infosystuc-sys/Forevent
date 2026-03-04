import { CreatePostSchema } from "@forevent/validators";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure, publicProcedure } from "../../trpc";
import { TRPCError } from "@trpc/server";

export const chatRouter = createTRPCRouter({
  all: publicProcedure.input(z.object({
    userId: z.string(),
    eventId: z.string(),
  })).query(async ({ input, ctx }) => {
    // return ctx.db.select().from(schema.post).orderBy(desc(schema.post.id));

    const myChats = await ctx.prisma.chat.findMany({
      where: {
        OR: [
          {
            requesterId: input.userId
          },
          {
            receiverId: input.userId
          }
        ],
        NOT: [
          {
            status: 'REJECTED'
          }
        ],
        eventId: input.eventId,
      },
      select: {
        receiver: {
          select: {
            id: true,
            user: {
              select: {
                image: true,
                name: true,
              }
            },
          }
        },
        requester: {
          select: {
            id: true,
            user: {
              select: {
                image: true,
                name: true,
              }
            },
          }
        },
        id: true,
        createdAt: true,
        messages: {
          orderBy: {
            createdAt: "desc"
          },
          take: 1,
          select: {
            text: true
          }
        }
      }
    });

    console.log(myChats, "myChats")

    return myChats;
  }),

  byId: publicProcedure.input(z.object({ chatId: z.string() })).query(async ({ ctx, input }) => {
    const chat = await ctx.prisma.chat.findUnique({
      where: { id: input.chatId, discharged: true },
      select: {
        id: true,
        createdAt: true,
        status: true,
        event: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        requester: {
          select: {
            id: true,
            user: {
              select: {
                name: true,
                image: true,
                email: true
              }
            }
          }
        },
        requesterId: true,
        receiver: {
          select: {
            id: true,
            user: {
              select: {
                name: true,
                image: true,
                email: true
              }
            }
          }
        },
        receiverId: true
      },
    })

    if (!chat) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: 'El chat solicitado no existe.'
      })
    }

    return chat
  }),

  create: publicProcedure.input(z.object({
    requesterId: z.string(),
    receiverId: z.string(),
    eventId: z.string(),
  })).mutation(async ({ ctx, input }) => {
    const exists = await ctx.prisma.chat.findFirst({
      where: {
        OR: [
          {
            requesterId: input.requesterId,
            receiverId: input.receiverId,
          },
          {
            requesterId: input.receiverId,
            receiverId: input.requesterId,
          },
        ],
        eventId: input.eventId
      },
      include: {
        requester: { include: { user: { select: { name: true, } } } }
      }
    })
    console.log(exists, "exists!")

    if (exists) {
      ctx.socket.connect()
      console.log(ctx.socket.active, "ANTES DE DESCONECTAR")
      ctx.socket.emit('login', { chatId: exists.id, name: exists.requester.user.name });
      ctx.socket.disconnect()
      throw new TRPCError({
        code: "CONFLICT",
        message: exists.id
      })
    }

    const chat = await ctx.prisma.chat.create({
      data: { ...input },
      include: { requester: { include: { user: { select: { name: true, } } } } }
    })

    if (!chat) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: 'No se pudo crear el chat.'
      })
    }

    ctx.socket.connect()
    console.log(ctx.socket.active, "ANTES DE DESCONECTAR")
    ctx.socket.emit('login', { chatId: chat.id, name: chat.requester.user.name });
    ctx.socket.disconnect()
    console.log(ctx.socket.active, "DESPUES DE DESCONECTAR")

    return chat.id
  }),

  delete: protectedProcedure.input(z.number()).mutation(({ ctx, input }) => {
    return
  }),
});
