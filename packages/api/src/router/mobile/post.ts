import { z } from "zod";

import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../../trpc";

export const postRouter = createTRPCRouter({
  all: publicProcedure.input(z.object({
    eventId: z.string()
  })).query(async ({ ctx, input }) => {
    const posts = await ctx.prisma.post.findMany({
      orderBy: { createdAt: 'desc' },
      where: {
        eventId: input.eventId,
        discharged: true,
      },
      include: {
        pictures: {
          select: {
            url: true,
            createdAt: true,
            updatedAt: true,
            id: true
          }
        },
        userOnEvent: {
          select: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
              }
            }
          }
        }
      }
    })

    console.log(posts, "posteos")

    return posts
  }),

  create: publicProcedure.input(z.object({
    url: z.string().url({ message: "URL inválida" }),
    about: z.string().optional(),
    userId: z.string(),
    eventId: z.string(),
  })).mutation(async ({ ctx, input }) => {
    const { about, userId, eventId, url } = input

    const userOnEvent = await ctx.prisma.userOnEvent.findFirst({
      where: {
        userId,
        eventId
      }
    })

    if (!userOnEvent) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: "User on event not found" })
    }

    const create = await ctx.prisma.post.create({
      data: {
        about: about ?? undefined,
        userOnEventId: userOnEvent.id,
        eventId,
        pictures:{
          create:{
            url,
            userOnEventId: userOnEvent.id
          }
        }
      }
    })

    return create
  }),

  delete: protectedProcedure.input(z.object({
    postId: z.string()
  })).mutation(async ({ ctx, input }) => {
    return await ctx.prisma.post.delete({
      where: {
        id: input.postId
      }
    })
  })
});
