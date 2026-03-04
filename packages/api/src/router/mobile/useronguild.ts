import { CreatePostSchema } from "@forevent/validators";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure, publicProcedure } from "../../trpc";

export const userOnGuildRouter = createTRPCRouter({
  all: publicProcedure.query(({ ctx }) => {
    // return ctx.db.select().from(schema.post).orderBy(desc(schema.post.id));
    return
  }),

  byId: publicProcedure.input(z.object({ userId: z.string() })).query(async ({ ctx, input }) => {
    const { userId } = input
    // Return an empty list instead of querying with an empty string, which
    // would scan the entire table and could expose data from other users.
    if (!userId) return [];
    return await ctx.prisma.userOnGuild.findMany({
      where: {
        userId,
        discharged: true,
      },
      select: {
        id: true,
        guild: {
          select: {
            id: true,
            name: true,
            image: true,
          }
        },
        role: true,
      }
    })
  }),

  create: protectedProcedure.input(z.object({

  })).mutation(({ ctx, input }) => {
    return
  }),

  delete: protectedProcedure.input(z.number()).mutation(({ ctx, input }) => {
    return
  }),
});
