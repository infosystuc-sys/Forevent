import { CreatePostSchema } from "@forevent/validators";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure, publicProcedure } from "../../trpc";
import { TRPCError } from "@trpc/server";

export const userOnEventRouter = createTRPCRouter({
  all: publicProcedure.input(z.object({
    eventId: z.string()
  })).query(async ({ ctx, input }) => {
    return await ctx.prisma.userOnEvent.findMany({
      where: {
        eventId: input.eventId,
        discharged: true,
      },
      select: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          }
        }
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
