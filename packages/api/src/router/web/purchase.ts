import { CreatePostSchema } from "@forevent/validators";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure, publicProcedure } from "../../trpc";
import { TRPCError } from "@trpc/server";
import { PaymentType } from "@forevent/db";

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

        deals: {
          select: {
            id: true,
            image: true,
            name: true,
            price: true,
            about: true,
          }
        },

        id: true,
        guildId: true
      }
    })

    console.log(eventElements, 'events elements')

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
      by: ['eventTicketId', 'productId', 'dealId'],
      where: {
        OR: [
          {
            eventTicketId: {
              in: eventElements.tickets.map((ticket) => ticket.id)
            }
          },
          {
            productId: {
              in: eventElements.products.map((product) => product.id)
            }
          },
          {
            dealId: {
              in: eventElements.deals.map(deal => deal.id)
            }
          }
        ]
      },
      _sum: {
        quantity: true,
      },
    })

    console.log(saleQuantities, 'salesssss')

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

    const totalDeals: { dealId: string, image: string, name: string, price: number, unitsSold: number, total: number, eventId: string, guildId: string }[] = []
    saleQuantities.map(sale => {
      eventElements.deals.map(deal => {
        if (sale.dealId === deal.id) {
          if (!totalDeals.find(item => sale.dealId === item.dealId)) {
            totalDeals.push({
              dealId: deal.id,
              image: deal.image!,
              name: deal.name,
              price: (deal.price ?? 0),
              unitsSold: sale._sum.quantity ?? 0,
              total: (sale._sum.quantity ?? 0) * (deal.price ?? 0),
              eventId: eventElements.id,
              guildId: eventElements.guildId
            })
          }
        }
      })
    })

    console.log(totalDeals, 'deals total resumen')

    return {
      totalSales,
      totalTickets,
      totalProducts,
      totalDeals
    }
  }),

  products: publicProcedure.input(z.object({
    products: z.array(z.object({
      quantity: z.number(),
      product: z.object({
        id: z.string(),
        type: z.enum(['DEAL', 'PRODUCT']),
      })
    })),
    userId: z.string()
  })).mutation(async ({ ctx, input }) => {
    const { products, userId } = input

    let data: {
      buyerId: string,
      ownerId: string,
      status: 'PENDING',
      productOnDepositId: string
    }[] = []
    let dealsIds: string[] = []

    products.map(prod => {
      if (prod.product.type === 'PRODUCT') {
        for (let index = 0; index < prod.quantity; index++) {
          data.push({
            buyerId: userId,
            ownerId: userId,
            productOnDepositId: prod.product.id,
            status: 'PENDING'
          })
        }
      } else {
        dealsIds.push(prod.product.id)
      }
    })

    const deals = await ctx.prisma.deal.findMany({
      where: {
        id: { in: dealsIds }
      },
      select: {
        id: true,
        productOnDeal: {
          select: {
            productId: true,
            quantity: true,
          }
        },
      }
    })

    products.map(prod => {
      if (prod.product.type === 'DEAL') {
        let deal = deals.find((deal) => deal.id === prod.product.id)
        if (!deal) {
          return
        }
        deal.productOnDeal.map(prodOnDeal => {
          for (let index = 0; index < prodOnDeal.quantity; index++) {
            data.push({
              buyerId: userId,
              ownerId: userId,
              productOnDepositId: prodOnDeal.productId,
              status: 'PENDING'
            })
          }
        })
      }
    })
    console.log("DATAT", data)
    await ctx.prisma.userPurchase.createMany({
      data
    })
  }),

  create: protectedProcedure.input(z.object({
    name: z.string(),
    paymentType: z.nativeEnum(PaymentType),
    items: z.array(z.object({
      name: z.string(),
      dealId: z.string().optional(),
      productId: z.string().optional(),
      quantity: z.number(),
      price: z.number()
    })),
    eventId: z.string()
  })).mutation(({ ctx, input }) => {

    const total = input.items.reduce((acumulator, currentValue) => acumulator + currentValue.quantity * currentValue.price, 0)

    return ctx.prisma.purchase.create({
      data: {
        eventId: input.eventId,
        total,
        type: input.paymentType,
        name: input.name,
        items: {
          createMany: {
            data: input.items.map(item => {
              return {
                quantity: item.quantity,
                dealId: item.dealId,
                productId: item.productId,
              }
            })
          }
        }
      }
    })
  }),

  delete: protectedProcedure.input(z.number()).mutation(({ ctx, input }) => {
    return
  }),
});
