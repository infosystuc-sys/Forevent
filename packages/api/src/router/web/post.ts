import { z } from "zod";

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

  create: protectedProcedure.input(z.object({
    about: z.string(),
    userOnEventId: z.string(),
    eventId: z.string(),
  })).mutation(async ({ ctx, input }) => {
    const { about, userOnEventId, eventId } = input
    return await ctx.prisma.post.create({
      data: {
        about,
        userOnEventId,
        eventId,
      }
    })
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
