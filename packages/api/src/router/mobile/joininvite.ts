import { CreatePostSchema } from "@forevent/validators";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure, publicProcedure } from "../../trpc";
import { TRPCError } from "@trpc/server";

export const joinInviteRouter = createTRPCRouter({
  all: publicProcedure.input(z.object({
    guildId: z.string(),
  })).query(async ({ ctx, input }) => {

  }),

  byId: publicProcedure.input(z.object({
    guildId: z.string(),
  })).query(async ({ ctx, input }) => {

  }),

  byUserId: publicProcedure.input(z.object({
    userId: z.string(),
  })).query(async ({ ctx, input }) => {
    const invites = await ctx.prisma.invite.findMany({
      where: {
        userId: input.userId,
        discharged: true
      },
      select: {
        id: true,
        guild: {
          select: {
            name: true,
            image: true,
          }
        },
        role: true,
      }
    })

    if (!invites) {
      throw new TRPCError({
        code: 'CONFLICT',
        message: 'Ocurrió un error al traer las invitaciones'
      })
    }

    return invites
  }),

  create: protectedProcedure.input(z.object({

  })).mutation(({ ctx, input }) => {
    return
  }),

  modify: publicProcedure.input(z.object({
    accept: z.boolean(),
    joinInviteId: z.string(),
  })).mutation(async ({ ctx, input }) => {
    const { accept, joinInviteId } = input
    const invite = await ctx.prisma.invite.findUnique({
      where: {
        id: joinInviteId
      }
    })
    if (!invite) {
      throw new TRPCError({
        code: 'CONFLICT',
        message: 'Ocurrió un error'
      })
    }

    return await ctx.prisma.invite.update({
      where: {
        id: joinInviteId
      },
      data: {
        discharged: accept
      },
      include: {
        guild: {
          select: {
            name: true,
          }
        }
      }
    })
  }),

  delete: protectedProcedure.input(z.number()).mutation(({ ctx, input }) => {
    return
  }),
});
