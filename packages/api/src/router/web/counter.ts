import { CreatePostSchema } from "@forevent/validators";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure, publicProcedure } from "../../trpc";

export const counterRouter = createTRPCRouter({
  all: publicProcedure.query(async ({ ctx }) => {
    // return ctx.db.select().from(schema.post).orderBy(desc(schema.post.id));
    return
  }),

  summary: protectedProcedure.input(z.object({
    eventId: z.string()
  })).query(async ({ ctx, input }) => {

  }),

  productExchanges: protectedProcedure.input(z.object({
    productId: z.string(),
    eventId: z.string()
  })).query(async ({ ctx, input }) => {
    const exchanges = await ctx.prisma.counter.findMany({
      where: {
        AND: [
          { eventId: input.eventId },
          {
            userPurchase: {
              some: {
                productOnDeposit: {
                  deposit: {
                    productsOnDeposit: {
                      some: {
                        productId: input.productId
                      }
                    }
                  }
                }
              }
            }
          }
        ]
      },
      select: {
        employeeOnEvent: {
          select: {
            userOnGuild: {
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
        },
        name: true,
        deposit: {
          select: {
            name: true,
            id: true,
            about: true,
            productsOnDeposit: {
              select: {
                quantity: true
              }
            }
          }
        },
        about: true,
        id: true,
        // userPurchase: {
        //   select: {

        //   }
        // }
      }
    })

    return exchanges
  }),

  byId: publicProcedure.input(z.object({ id: z.number() })).query(({ ctx, input }) => {
    // return ctx.db
    //   .select()
    //   .from(schema.post)
    //   .where(eq(schema.post.id, input.id));

    return
  }),

  create: protectedProcedure.input(z.object({

  })).mutation(({ ctx, input }) => {
    return
  }),

  update: protectedProcedure.input(CreatePostSchema).mutation(({ ctx, input }) => {
      return
    }),

  delete: protectedProcedure.input(z.number()).mutation(({ ctx, input }) => {
    return
  }),
});
