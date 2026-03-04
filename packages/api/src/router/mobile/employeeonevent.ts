import { CreatePostSchema } from "@forevent/validators";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure, publicProcedure } from "../../trpc";
import { TRPCError } from "@trpc/server";

export const employeeOnEventRouter = createTRPCRouter({
  all: protectedProcedure.input(z.object({
    eventId: z.string()
  })).query(async ({ ctx, input }) => {
    return await ctx.prisma.employeeOnEvent.findMany({
      where: {
        eventId: input.eventId,
        discharged: true,
      },
      include: {
        userOnGuild: {
          select: {
            user: {
              select: {
                image: true,
                name: true,
              }
            }
          }
        },
        gate: {
          select: {
            name: true,
            about: true
          }
        },
      }
    })
  }),

  create: protectedProcedure.input(z.object({

  })).mutation(({ ctx, input }) => {
    return
  }),

  modifyEmployee: protectedProcedure.input(
    z.object({
      employeeOnEventId: z.string(),
      discharged: z.boolean().optional(),
    })
  ).mutation(async ({ ctx, input }) => {
    const body = input
    const data = (({ employeeOnEventId: employeeId, ...obj }) => obj)(body)

    console.log(body, 'YEAH BUDDY')

    const update = await ctx.prisma.employeeOnEvent.update({
      where: {
        id: body.employeeOnEventId
      },
      data,
      select: {
        id: true
      }
    })

    if (!update) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Error al modificar empleado',
      });
    }

    return update
  }),

  events: publicProcedure.input(z.object({
    userOnGuildId: z.string()
  })).query(async ({ ctx, input }) => {
    const events = ctx.prisma.employeeOnEvent.findMany({
      where: {
        userOnGuildId: input.userOnGuildId,
        discharged: true,
      },
      select: {
        event: {
          select: {
            id: true,
            name: true,
            image: true,
            about: true,
            startsAt: true,
            endsAt: true,
            location: {
              select: {
                name: true,
                address: true,
                city: true,
              }
            },
          }
        },
        counter: {
          select: {
            name: true,
          }
        }
      }
    })

    return events
  }),

  delete: protectedProcedure.input(z.number()).mutation(({ ctx, input }) => {
    return
  }),
});
