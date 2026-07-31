import { CreatePostSchema } from "@forevent/validators";
import { z } from "zod";
import { randomUUID } from "crypto";

import { createTRPCRouter, mobileProtectedProcedure, protectedProcedure, publicProcedure } from "../../trpc";
import { TRPCError } from "@trpc/server";
import { expandDealsIntoProducts, sumChargeableTotal, type CartLine } from "../../lib/cartPricing";

export const purchaseRouter = createTRPCRouter({
  all: publicProcedure.input(z.object({
    eventId: z.string()
  })).query(async ({ ctx, input }) => {
    const purchases = await ctx.prisma.purchase.findMany({
      where: {
        eventId: input.eventId
      },
    })

    return purchases
  }),

  total: publicProcedure.input(z.object({
    eventId: z.string()
  })).query(async ({ ctx, input }) => {

    const totalSales = await ctx.prisma.purchase.aggregate({
      where: {
        eventId: input.eventId
      },
      _sum: {
        total: true
      }
    })

    const eventElements = await ctx.prisma.event.findUnique({
      where: {
        id: input.eventId
      },
      select: {
        tickets: true,
        products: {
          select: {
            id: true,
            name: true,
            image: true,
            type: true,
            about: true,
            price: true,
            productOnDeposit: {
              select: {
                quantity: true
              }
            }
          }
        },
        id: true,
        guildId: true
      }
    })

    if (!eventElements?.tickets) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "No encontramos tickets en venta en este evento"
      })
    }

    if (!eventElements?.products) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Este evento no tiene productos en venta"
      })
    }

    const saleQuantities = await ctx.prisma.itemOnPurchase.groupBy({
      by: ['eventTicketId', 'productId'],
      where: {
        OR: [
          {
            eventTicketId: {
              "in": eventElements.tickets.map((ticket) => ticket.id)
            }
          },
          {
            productId: {
              "in": eventElements.products.map((product) => product.id)
            }
          }
        ]
      },
      _sum: {
        quantity: true,
      },
    })

    // console.log(saleQuantities, 'sol ticke cuaitii')

    const totalTickets: { ticketId: string, name: string, price: number, unitsSold: number, unitsAvailable: number, total: number, eventId: string, guildId: string }[] = []
    saleQuantities.map((ticket) => {
      eventElements.tickets.map((eventTicket) => {
        if (ticket.eventTicketId === eventTicket.id) {
          if (!totalTickets.find((item) => ticket.eventTicketId === item.ticketId)) {
            totalTickets.push({
              ticketId: eventTicket.id,
              name: eventTicket.name,
              price: eventTicket.price,
              unitsSold: ticket._sum.quantity ?? 0,
              unitsAvailable: eventTicket.quantity,
              total: (ticket._sum.quantity ?? 0) * eventTicket.price,
              eventId: eventElements.id,
              guildId: eventElements.guildId
            })
          }
        }
      })
    })

    const totalProducts: { productId: string, image: string, name: string, price: number, unitsSold: number, unitsAvailable: number, total: number, eventId: string, guildId: string }[] = []
    saleQuantities.map(sale => {
      eventElements.products.map(product => {
        if (sale.productId === product.id) {
          if (!totalProducts.find(item => sale.productId === item.productId)) {
            totalProducts.push({
              productId: product.id,
              image: product.image!,
              name: product.name,
              price: (product.price ?? 0),
              unitsSold: sale._sum.quantity ?? 0,
              unitsAvailable: product.productOnDeposit.reduce((acumulator, currentValue) => acumulator + currentValue.quantity, 0),
              total: (sale._sum.quantity ?? 0) * (product.price ?? 0),
              eventId: eventElements.id,
              guildId: eventElements.guildId
            })
          }
        }
      })
    })

    return {
      totalSales,
      totalTickets,
      totalProducts
    }
  }),


  byId: publicProcedure.input(z.object({ id: z.number() })).query(({ ctx, input }) => {
    // return ctx.db
    //   .select()
    //   .from(schema.post)
    //   .where(eq(schema.post.id, input.id));

    return
  }),

  products: mobileProtectedProcedure.input(z.object({
    products: z.array(z.object({
      quantity: z.number(),
      product: z.object({
        id: z.string(),
        type: z.enum(['DEAL', 'PRODUCT']),
      })
    })),
    eventId: z.string()
  })).mutation(async ({ ctx, input }) => {
    const { products, eventId } = input
    const userId = ctx.user.id

    const cart: CartLine[] = products.map(prod => ({
      productId: prod.product.id,
      quantity: prod.quantity,
      type: prod.product.type,
    }))

    const dealIds = cart.filter(line => line.type === 'DEAL').map(line => line.productId)

    const dbDeals = await ctx.prisma.deal.findMany({
      where: {
        id: { "in": dealIds }
      },
      select: {
        id: true,
        productOnDeal: true,
        price: true,
      }
    })

    const { prods, chargeableQuantities, dealsTotal } = expandDealsIntoProducts(cart, dbDeals)

    const updateData: {
      prodOnDepositId: string,
      quantity: number
    }[] = []

    const prodOnDeposit = await ctx.prisma.productOnDeposit.findMany({
      orderBy: { quantity: 'desc' },
      where: {
        productId: { "in": prods.map(prod => prod.productId) },
      },
      select: {
        id: true,
        quantity: true,
        depositId: true,
        productId: true,
        product: {
          select: {
            name: true,
            price: true,
          }
        }
      }
    })

    const productPrices: Record<string, number> = {}
    for (const dep of prodOnDeposit) {
      if (dep.product.price != null) {
        productPrices[dep.productId] = dep.product.price
      }
    }

    // Total = precio de los deals + precio individual de lo que NO vino cubierto por un deal
    // (antes se salteaba el cobro completo de un producto si aparecía en algún deal comprado,
    // aunque parte de su cantidad hubiera sido pedida suelta — ver cartPricing.test.ts)
    let total = dealsTotal + sumChargeableTotal(chargeableQuantities, productPrices)

    let data: {
      id: string,
      buyerId: string,
      ownerId: string,
      status: 'PENDING',
      productOnDepositId: string
    }[] = []

    prods.map((prod) => {
      let prodName = ''
      const onOneDep = prodOnDeposit.some((prodOnDep) => {
        if (prodOnDep.productId === prod.productId) {
          if (prodOnDep.quantity >= prod.quantity) {
            for (let index = 0; index < prod.quantity; index++) {
              data.push({
                id: randomUUID(),
                buyerId: userId,
                ownerId: userId,
                status: 'PENDING',
                productOnDepositId: prodOnDep.id
              })
            }
            updateData.push({
              prodOnDepositId: prodOnDep.id,
              quantity: prodOnDep.quantity - prod.quantity
            })
            return true
          }
          prodName = prodOnDep.product.name
          return false
        }
        return false
      })

      if (!onOneDep) {
        let quantity = prod.quantity
        prodOnDeposit.map((prodOnDep) => {
          if (prodOnDep.productId === prod.productId) {
            let loop = quantity < prodOnDep.quantity ? quantity : prodOnDep.quantity
            for (let index = 0; index < loop; index++) {
              data.push({
                id: randomUUID(),
                buyerId: userId,
                ownerId: userId,
                status: 'PENDING',
                productOnDepositId: prodOnDep.id
              })
            }
            updateData.push({
              prodOnDepositId: prodOnDep.id,
              quantity: prodOnDep.quantity - loop
            })
            quantity -= loop
          }
        })
        if (quantity > 0) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: `No hay suficiente de "${prodName}" `
          })
        }
      }
    })

    const transaction = await ctx.prisma.$transaction(async (trans) => {

      await trans.userPurchase.createMany({
        data
      })

      const purchase = await trans.purchase.create({
        data: {
          total,
          buyerId: userId,
          eventId,
          status: 'ACCEPTED',
        }
      })

      await Promise.all(
        updateData.map((update) =>
          trans.productOnDeposit.update({
            where: { id: update.prodOnDepositId },
            data: { quantity: update.quantity },
          })
        )
      );

      return {
        purchaseId: purchase.id,
        userPurchaseIds: data.map((d) => d.id),
      }
    })

    return transaction
  }),

  create: protectedProcedure.input(z.object({

  })).mutation(({ ctx, input }) => {
    return
  }),

  "delete": protectedProcedure.input(z.number()).mutation(({ ctx, input }) => {
    return
  }),
});
