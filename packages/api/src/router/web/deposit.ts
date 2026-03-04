import { CreatePostSchema } from "@forevent/validators";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure, publicProcedure } from "../../trpc";
import { TRPCError } from "@trpc/server";

export const depositRouter = createTRPCRouter({
  all: publicProcedure.query(({ ctx }) => {
    // return ctx.db.select().from(schema.post).orderBy(desc(schema.post.id));
    return
  }),

  byId: publicProcedure.input(z.object({ id: z.number() })).query(({ ctx, input }) => {
    // return ctx.db
    //   .select()
    //   .from(schema.post)
    //   .where(eq(schema.post.id, input.id));

    return
  }),

  byGuildId: publicProcedure.input(z.object({ guildId: z.string() })).query(async ({ ctx, input }) => {
    console.log("haydidi", input.guildId)
    return await ctx.prisma.deposit.findMany({
      where: {
        event: {
          guildId: input.guildId,
          discharged: true,
        },
      },
      include: {
        event: {
          select: {
            name: true,
            id: true
          }
        },
      }
    })
  }),

  assign: publicProcedure.input(z.object({
    productId: z.string(),
    quantity: z.number(),
    depositId: z.string()
  })).mutation(async ({ ctx, input }) => {
    const { productId, quantity, depositId } = input

    const deposit = await ctx.prisma.deposit.findUnique({
      where: {
        id: depositId,
      },
      select: {
        productsOnDeposit: {
          take: 1,
          where: {
            productId,
            discharged: true,
          }
        },
      }
    })

    if (!deposit) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Deposito no encontrado'
      })
    }

    if (deposit.productsOnDeposit.length > 0 && deposit.productsOnDeposit[0]) {
      return await ctx.prisma.productOnDeposit.update({
        where: {
          id: deposit.productsOnDeposit[0].id
        },
        data: {
          quantity: quantity + deposit.productsOnDeposit[0].quantity
        }
      })
    } else {
      return await ctx.prisma.productOnDeposit.create({
        data: {
          productId,
          depositId,
          quantity
        }
      })
    }
  }),

  create: protectedProcedure.input(z.object({

  })).mutation(({ ctx, input }) => {
    return
  }),

  update: protectedProcedure
    .input(CreatePostSchema)
    .mutation(({ ctx, input }) => {
      return
    }),

  delete: protectedProcedure.input(z.number()).mutation(({ ctx, input }) => {
    return
  }),
});
