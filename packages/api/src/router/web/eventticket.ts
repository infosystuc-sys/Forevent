import { CreatePostSchema } from "@forevent/validators";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure, publicProcedure } from "../../trpc";
import { TRPCError } from "@trpc/server";
import { dayjs } from "../../lib/utils";

export const eventTicketRouter = createTRPCRouter({
  all: publicProcedure.query(({ ctx }) => {
    // return ctx.db.select().from(schema.post).orderBy(desc(schema.post.id));
    return
  }),

  byId: publicProcedure.input(z.object({
    ticketId: z.string()
  })).query(async ({ ctx, input }) => {
    return await ctx.prisma.eventTicket.findUnique({
      where: {
        id: input.ticketId
      }
    })
  }),

  purchase: publicProcedure.input(z.object({
    userId: z.string(),
    tickets: z.object({
      quantity: z.number(),
      ticketId: z.string()
    }).array()
  })).mutation(async ({ ctx, input }) => {
    const { tickets, userId } = input
    console.log("purchase")

    const eventTickets = await ctx.prisma.eventTicket.findMany({
      where: {
        id: { in: tickets.map(ticket => ticket.ticketId) },
      },
      include: {
        _count: {
          select: {
            userTicket: true
          }
        },
        event: {
          select: {
            guild: {
              select: {
                mp_token: true
              }
            }
          }
        }
      }
    })

    if (!eventTickets) {
      throw new TRPCError({
        code: 'CONFLICT',
        message: 'No encontramos los tickets'
      })
    }

    eventTickets.map((eventTicket, index) => {
      console.log(tickets, "tickets!!!!")
      let ticketData = tickets?.find((ticket) => ticket.ticketId === eventTicket.id)
      console.log(ticketData, "ticket", eventTicket.name, "nombre", !!tickets?.find((ticket) => ticket.ticketId === eventTicket.id))
      if (ticketData && ticketData.quantity > 0 && (eventTicket.quantity - eventTicket._count.userTicket < ticketData.quantity)) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: `Quedan ${eventTicket.quantity - eventTicket._count.userTicket} entrada(s) ${eventTicket.name}`
        })
      }
    })

    const user = await ctx.prisma.user.findUnique({
      where: {
        id: userId
      },
      select: {
        id: true
      }
    })

    if (!user) {
      throw new TRPCError({
        code: 'CONFLICT',
        message: 'Ocurrió un error'
      })
    }

    let data: {
      buyerId: string,
      ownerId: string,
      ticketId: string,
      status: 'PENDING' | 'ACCEPTED',
    }[] = []

    tickets.map((ticket, index) => {
      for (let i = 0; i < ticket.quantity; i++) {
        data.push({
          buyerId: user.id,
          ownerId: user.id,
          ticketId: ticket.ticketId,
          status: 'PENDING' // ACCEPTED es para cuando el ticket es usado
        })
      }
    })

    // const price = eventTicket.price * quantity
    // const FEE = price * .04; // Calculo el costo de comision del 4% del precio del producto
    // const preferenceResponse = await ctx.createPayment(price, FEE)
    // await ctx.prisma.$transaction(async (transaction) => {
    //   await transaction.purchase.create({
    //     data: {
    //       buyerId: user.id,
    //       items: {
    //         create: {
    //           quantity,
    //           ticketId,
    //         }
    //       },
    //       price,
    //       eventId: eventTicket.eventId,
    //       mp_preferenceId: preferenceResponse.response.id
    //     }
    //   })
    //   await transaction.userTicket.createMany({
    //     data
    //   })
    // })
    // return preferenceResponse.response

    return await ctx.prisma.userTicket.createMany({
      data
    })
  }),
});
