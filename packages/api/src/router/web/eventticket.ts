import { CreatePostSchema } from "@forevent/validators";
import { z } from "zod";

import { createTRPCRouter, mobileProtectedProcedure, protectedProcedure, publicProcedure } from "../../trpc";
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

  purchase: mobileProtectedProcedure.input(z.object({
    tickets: z.object({
      quantity: z.number(),
      ticketId: z.string()
    }).array()
  })).mutation(async ({ ctx, input }) => {
    const { tickets } = input
    const userId = ctx.user.id

    const eventTickets = await ctx.prisma.eventTicket.findMany({
      where: {
        id: { "in": tickets.map(ticket => ticket.ticketId) },
      },
      include: {
        _count: {
          select: {
            userTicket: true
          }
        }
      }
    })

    if (!eventTickets.length) {
      throw new TRPCError({
        code: 'CONFLICT',
        message: 'No encontramos los tickets'
      })
    }

    // El total se calcula siempre desde el precio en DB (eventTicket.price), nunca
    // se confía en un monto mandado por el cliente — evita que se "regale" una entrada.
    let total = 0
    eventTickets.map((eventTicket) => {
      let ticketData = tickets?.find((ticket) => ticket.ticketId === eventTicket.id)
      if (ticketData && ticketData.quantity > 0 && (eventTicket.quantity - eventTicket._count.userTicket < ticketData.quantity)) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: `Quedan ${eventTicket.quantity - eventTicket._count.userTicket} entrada(s) ${eventTicket.name}`
        })
      }
      if (ticketData) {
        total += eventTicket.price * ticketData.quantity
      }
    })

    let data: {
      buyerId: string,
      ownerId: string,
      ticketId: string,
      status: 'PENDING' | 'ACCEPTED',
    }[] = []

    tickets.map((ticket) => {
      for (let i = 0; i < ticket.quantity; i++) {
        data.push({
          buyerId: userId,
          ownerId: userId,
          ticketId: ticket.ticketId,
          status: 'PENDING' // ACCEPTED es para cuando el ticket es usado
        })
      }
    })

    // Mercado Pago todavía no está integrado (en pausa hasta tener credenciales de
    // test), así que por ahora no se cobra de verdad — pero queda un Purchase con el
    // total real en DB para trazabilidad, en vez de crear UserTicket sin ningún registro.
    return await ctx.prisma.$transaction(async (trans) => {
      await trans.purchase.create({
        data: {
          buyerId: userId,
          eventId: eventTickets[0]!.eventId,
          total,
          status: 'PENDING',
          items: {
            createMany: {
              data: tickets.map(ticket => ({
                quantity: ticket.quantity,
                eventTicketId: ticket.ticketId,
              }))
            }
          }
        }
      })

      return trans.userTicket.createMany({
        data
      })
    })
  }),
});
