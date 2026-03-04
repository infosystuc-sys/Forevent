import { CreatePostSchema } from "@forevent/validators";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure, publicProcedure } from "../../trpc";
import { TRPCError } from "@trpc/server";

export const productRouter = createTRPCRouter({
  all: publicProcedure.query(({ ctx }) => {
    // return ctx.db.select().from(schema.post).orderBy(desc(schema.post.id));
    return
  }),

  byId: publicProcedure.input(z.object({ productId: z.string() })).query(async ({ ctx, input }) => {
    return await ctx.prisma.product.findUnique({
      where: {
        id: input.productId
      }
    })
  }),

  onEvent: publicProcedure.input(z.object({
    eventId: z.string()
  })).query(async ({ ctx, input }) => {
    const event = await ctx.prisma.event.findUnique({
      where: {
        id: input.eventId
      },
      select: {
        deals: {
          where: {
            discharged: true,
          },
          select: {
            id: true,
            name: true,
            price: true,
            about: true,
            image: true,
          }
        },
        counters: {
          select: {
            deposit: {
              select: {
                productsOnDeposit: {
                  where: {
                    discharged: true,
                  },
                  select: {
                    id: true,
                    product: {
                      select: {
                        id: true,
                        name: true,
                        image: true,
                        price: true,
                        about: true,
                        type: true,
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    })

    if (!event) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Event not found'
      })
    }

    type product = {
      id: string,
      name: string,
      image: string | null,
      price: number | null,
      about: string | null,
    }
    console.log(event, 'EVENTT')

    let drinks: Array<product> = [], foods: Array<product> = []

    event?.counters.map(counter => {
      counter.deposit.productsOnDeposit.map(prod => {
        if (prod.product.type === 'DRINK') {
          if (!drinks.some(drink => drink.id === prod.product.id)) {
            drinks.push({
              id: prod.id,
              about: prod.product.about,
              image: prod.product.image,
              name: prod.product.name,
              price: prod.product.price
            })
          }
        } else if (prod.product.type === 'FOOD') {
          if (!foods.some(food => food.id === prod.product.id)) {
            foods.push({
              id: prod.id,
              about: prod.product.about,
              image: prod.product.image,
              name: prod.product.name,
              price: prod.product.price
            })
          }
        }
      })
    })

    return { deals: event?.deals, drinks, foods }
  }),

  create: protectedProcedure.input(z.object({

  })).mutation(({ ctx, input }) => {
    return
  }),

  delete: protectedProcedure.input(z.number()).mutation(({ ctx, input }) => {
    return
  }),
});
