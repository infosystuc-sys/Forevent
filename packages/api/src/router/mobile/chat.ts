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

    const requester = await ctx.prisma.userOnEvent.findFirst({
      where: {
        userId: input.userId,
        eventId: input.eventId,
        discharged: true
      }
    })

    if (!requester) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: 'El usuario solicitante no está registrado en el evento.'
      })
    }

    const receiver = await ctx.prisma.userOnEvent.findFirst({
      where: {
        userId: input.userId,
        eventId: input.eventId,
        discharged: true
      }
    })

    if (!receiver) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: 'El usuario solicitado no está registrado en el evento.'
      })
    }

    console.log(requester, receiver, "jajajaja")

    const myChats = await ctx.prisma.chat.findMany({
      where: {
        OR: [
          {
            requesterId: requester.id
          },
          {
            receiverId: receiver.id
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
            user: {
              select: {
                image: true,
                name: true,
                id: true
              }
            }
          }
        },
        requester: {
          select: {
            user: {
              select: {
                image: true,
                name: true,
                id: true
              }
            }
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
            user: {
              select: {
                id: true,
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
            user: {
              select: {
                id: true,
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
    console.log(input, "yeah buddy!!")

    const requester = await ctx.prisma.userOnEvent.findFirst({
      where: {
        userId: input.requesterId,
        eventId: input.eventId,
        discharged: true
      }
    })

    if (!requester) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: 'El usuario solicitante no está registrado en el evento.'
      })
    }

    const receiver = await ctx.prisma.userOnEvent.findFirst({
      where: {
        userId: input.receiverId,
        eventId: input.eventId,
        discharged: true
      }
    })

    if (!receiver) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: 'El usuario solicitado no está registrado en el evento.'
      })
    }

    console.log(requester, receiver, "jajajaja")

    const exists = await ctx.prisma.chat.findFirst({
      where: {
        OR: [
          {
            requesterId: requester.id,
            receiverId: receiver.id,
          },
          {
            requesterId: receiver.id,
            receiverId: requester.id,
          },
        ],
        eventId: input.eventId
      },
      include: {
        requester: {
          select: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
                email: true
              }
            }
          }
        },
        receiver: {
          select: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
                email: true
              }
            }
          }
        }
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
      data: {
        requesterId: requester.id,
        receiverId: receiver.id,
        eventId: input.eventId,
      },
      select: {
        id: true,
        createdAt: true,
        messages: true,
        requesterId: true,
        receiverId: true,
        requester: {
          select: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
                email: true
              }
            }
          }
        },
        receiver: {
          select: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
                email: true
              }
            }
          }
        },
        status: true,
      }
    })

    if (!chat) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: 'No se pudo crear el chat.'
      })
    }

    ctx.socket.connect()
    console.log(ctx.socket.active, "ANTES DE DESCONECTAR")
    ctx.socket.emit('login', { chatId: chat.id, name: chat.requesterId });
    ctx.socket.disconnect()
    console.log(ctx.socket.active, "DESPUES DE DESCONECTAR")

    return chat.id
  }),

  delete: protectedProcedure.input(z.number()).mutation(({ ctx, input }) => {
    return
  }),
});
