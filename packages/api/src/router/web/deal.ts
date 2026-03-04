import { CreatePostSchema } from "@forevent/validators";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure, publicProcedure } from "../../trpc";

export const dealRouter = createTRPCRouter({
  all: publicProcedure.query(({ ctx }) => {
    // return ctx.db.select().from(schema.post).orderBy(desc(schema.post.id));
    return
  }),

  byId: publicProcedure.input(z.object({ dealId: z.string() })).query(async ({ ctx, input }) => {
      return await ctx.prisma.deal.findUnique({
        where: {
          id: input.dealId
        }
      })
    }),

  create: publicProcedure.input(z.object({
    name: z.string().min(2, { message: "Este campo es requerido" }),
    image: z.string().url().min(2, { message: "Este campo es requerido" }),
    about: z.string().optional(),
    price: z.coerce.number().min(0, { message: "Este campo es requerido" }),
    productsOnDeal: z.array(z.object({
      product: z.object({
        productId: z.string().min(2, { message: "Este campo es requerido" }),
        name: z.string().min(2, { message: "Este campo es requerido" }),
      }),
      quantity: z.coerce.number().min(0, { message: "Este campo es requerido" }),
    })),
    eventId: z.string()
  })).mutation(async ({ ctx, input }) => {
    const { productsOnDeal, ...data } = input

    return await ctx.prisma.deal.create({
      data: {
        ...data,
        expiresAt: new Date(),
        productOnDeal: {
          createMany: {
            data: productsOnDeal.map(pod => {
              return {
                productId: pod.product.productId,
                quantity: pod.quantity
              }
            })
          }
        }
      }
    })
  }),

  update: protectedProcedure
    .input(CreatePostSchema)
    .mutation(({ ctx, input }) => {
      return
    }),

  delete: protectedProcedure.input(z.number()).mutation(({ ctx, input }) => {
    return
  }),

  exchanges: protectedProcedure.input(z.object({
    eventId: z.string(),
    dealId: z.string(),
  })).query(async ({ ctx, input }) => {

    const exchanges = await ctx.prisma.userPurchase.findMany({
      where: {
        dealId: input.dealId
      },
      select: {
        counter: {
          select: {
            id: true,
            name: true,
            deposit: {
              select: {
                name: true,
                about: true,
                id: true
              }
            }
          }
        },
        cashier: {
          select: {
            user: {
              select: {
                name: true,
                id: true
              }
            }
          }
        },
        owner: {
          select: {
            name: true,
            id: true,
          }
        },
        deal: {
          select: {
            name: true
          }
        },
        productOnDeposit: {
          select: {
            product: {
              select: {
                name: true,
                image: true,
                id: true,
                about: true
              }
            }
          }
        }
      }
    })
    console.log('exchanges de la deal', exchanges)
    return exchanges
  }),
});
