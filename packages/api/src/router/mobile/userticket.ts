import { CreatePostSchema } from "@forevent/validators";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure, publicProcedure } from "../../trpc";
import { TRPCError } from "@trpc/server";
import { dayjs } from "../../lib/utils";

export const userTicketRouter = createTRPCRouter({
  /**
   * Todos los tickets visibles para un usuario:
   *   1. Tickets que ya son suyos (ownerId = userId), incluyendo transferencias aceptadas.
   *   2. Tickets PENDIENTES de regalo donde él es el receptor (gift.giftReceiverId = userId),
   *      aunque ownerId siga siendo el emisor hasta la aceptación.
   *
   * Campos extra en la respuesta:
   *   · isSentGift       — yo soy el emisor del regalo pendiente
   *   · isIncomingGift   — yo soy el receptor del regalo pendiente (aún no acepté)
   *   · giftSenderName/Image — quién me lo regaló (pendiente o aceptado)
   */
  list: publicProcedure.input(z.object({
    userId: z.string()
  })).query(async ({ ctx, input }) => {
    const user = await ctx.prisma.user.findUnique({
      where: { id: input.userId },
      select: { id: true }
    })
    if (!user) {
      throw new TRPCError({ code: 'CONFLICT', message: 'Ocurrió un error' })
    }

    const rows = await ctx.prisma.userTicket.findMany({
      where: {
        discharged: true,
        status: 'PENDING',
        OR: [
          // Mis tickets (propios + transferidos tras aceptar regalo)
          { ownerId: input.userId },
          // Regalos pendientes donde soy el receptor (ticket aún con el emisor)
          {
            gift: {
              giftReceiverId: input.userId,
              status: 'PENDING',
            },
          },
        ],
      },
      select: {
        id: true,
        giftId: true,
        ownerId: true,
        ticket: {
          select: {
            id: true,
            name: true,
            event: {
              select: {
                id: true,
                image: true,
                name: true,
                startsAt: true,
                endsAt: true,
                location: { select: { name: true } },
              }
            }
          }
        },
        // Regalo activo (via giftId): el registro Gift que "bloquea" este ticket
        gift: {
          select: {
            id: true,
            status: true,
            giftRequesterId: true,
            giftRequester: { select: { id: true, name: true, image: true } },
            giftReceiverId: true,
            giftReceiver: { select: { id: true, name: true, image: true } },
          }
        },
        // Historial de transferencias aceptadas hacia mí (para "Recibido de" post-aceptación)
        gifts: {
          where: {
            status: 'ACCEPTED',
            giftReceiverId: input.userId,
          },
          select: {
            giftRequester: { select: { id: true, name: true, image: true } },
          },
          take: 1,
        },
      }
    })

    const tickets = rows.map(t => {
      const isIncomingGift = t.giftId != null && t.gift?.giftReceiverId === input.userId
      const isSentGift     = t.giftId != null && t.gift?.giftRequesterId === input.userId

      // Quién me envió el regalo: pendiente (gift.giftRequester) o ya aceptado (gifts[])
      const senderInfo = isIncomingGift
        ? (t.gift?.giftRequester ?? null)
        : (t.gifts[0]?.giftRequester ?? null)

      return {
        id: t.id,
        userTicketId: t.id,
        giftId: t.giftId ?? null,
        url: t.id,
        quantity: 1,
        isSentGift,
        isIncomingGift,
        giftSenderName:  senderInfo?.name  ?? null,
        giftSenderImage: senderInfo?.image ?? null,
        eventTicket: {
          id: t.ticket.id,
          name: t.ticket.name,
          locatioName: t.ticket.event.location?.name ?? 'Ubicación',
          event: {
            id: t.ticket.event.id,
            name: t.ticket.event.name,
            image: t.ticket.event.image ?? 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Placeholder_view_vector.svg/1200px-Placeholder_view_vector.svg.png',
            startsAt: t.ticket.event.startsAt,
            endsAt: t.ticket.event.endsAt,
          },
        },
        gift: t.gift ? {
          id: t.gift.id,
          status: t.gift.status,
          giftRequesterId: t.gift.giftRequesterId,
          giftRequester: t.gift.giftRequester,
          giftReceiver: t.gift.giftReceiver,
        } : null,
      }
    })

    return tickets
  }),

  all: publicProcedure.input(z.object({
    userId: z.string()
  })).query(async ({ ctx, input }) => {
    const user = await ctx.prisma.user.findUnique({
      where: {
        id: input.userId
      },
      select: {
        id: true
      }
    })
    if (!user) {
      throw new TRPCError({
        code: 'CONFLICT',
        message: 'Ocurrió un error',
      });
    }
    // Mis Entradas (disponibles): solo tickets donde giftId === null
    // La BD es la única fuente de verdad; giftId vincula 1:1 con Gift.
    const ticket = await ctx.prisma.userTicket.findMany({
      where: {
        ownerId: input.userId,
        status: "PENDING",
        discharged: true,
        giftId: null,
      },
      select: {
        id: true,
        giftId: true,
        ticket: {
          select: {
            about: true,
            event: { select: { image: true, name: true, startsAt: true, endsAt: true, location: true, id: true } },
            id: true,
            name: true,
            validUntil: true,
          }
        },
        ownerId: true,
        status: true,
        gift: {
          select: { id: true, status: true, giftRequesterId: true, userTicketId: true },
        },
      }
    })
    if (!ticket) {
      return
    }

    type TicketRow = {
      id: string,
      userTicketId: string,
      eventTicket: {
        id: string,
        locatioName: string,
        name: string,
        event: { name: string, image: string, startsAt: Date, endsAt: Date }
      },
      url: string,
      quantity: number,
      gifts: { id: string; status: string; userTicketId: string | null }[],
      isGift: boolean,
      isGiftBlocking: boolean,
    }

    // Con giftId === null, todos los tickets retornados están libres. gifts: [] siempre.
    return ticket.map((tick): TicketRow => {
      const g = tick.gift
      const gifts: { id: string; status: string; userTicketId: string | null }[] =
        g ? [{ id: g.id, status: g.status, userTicketId: g.userTicketId }] : []
      const isGift = g != null
      const isGiftBlocking = isGift && (g!.status === 'PENDING' || g!.status === 'ACCEPTED')

      return {
        id: tick.id,
        userTicketId: tick.id,
        eventTicket: {
          id: tick.ticket.id,
          locatioName: tick.ticket.event.location?.name ?? 'Ubicación',
          name: tick.ticket.name,
          event: {
            name: tick.ticket.event.name,
            endsAt: tick.ticket.event.endsAt,
            startsAt: tick.ticket.event.startsAt,
            image: tick.ticket.event.image ?? "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Placeholder_view_vector.svg/1200px-Placeholder_view_vector.svg.png"
          }
        },
        url: tick.id,
        quantity: 1,
        gifts,
        isGift,
        isGiftBlocking,
      }
    })
  }),

  // ─── Tickets enviados como regalo y aún PENDING ───────────────────────────────
  sentGifts: publicProcedure.input(z.object({
    userId: z.string(),
  })).query(async ({ ctx, input }) => {
    const { userId } = input

    const tickets = await ctx.prisma.userTicket.findMany({
      where: {
        ownerId: userId,
        status: 'PENDING',
        gifts: {
          some: {
            giftRequesterId: userId,
            status: 'PENDING',
          },
        },
      },
      select: {
        id: true,
        ticket: {
          select: {
            id: true,
            name: true,
            event: {
              select: {
                id: true,
                name: true,
                image: true,
                startsAt: true,
                endsAt: true,
                location: { select: { name: true } },
              },
            },
          },
        },
        gifts: {
          where: { giftRequesterId: userId, status: 'PENDING' },
          select: {
            id: true,
            status: true,
            giftReceiver: { select: { id: true, name: true, image: true } },
          },
          take: 1,
        },
      },
    })

    return tickets.map(t => ({
      userTicketId: t.id,
      giftId:       t.gifts[0]?.id       ?? null,
      giftStatus:   t.gifts[0]?.status   ?? null,
      giftReceiver: t.gifts[0]?.giftReceiver ?? null,
      eventTicket: {
        id:          t.ticket.id,
        name:        t.ticket.name,
        locatioName: t.ticket.event.location?.name ?? '',
        event: {
          id:       t.ticket.event.id,
          name:     t.ticket.event.name,
          image:    t.ticket.event.image ?? 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Placeholder_view_vector.svg/1200px-Placeholder_view_vector.svg.png',
          startsAt: t.ticket.event.startsAt,
          endsAt:   t.ticket.event.endsAt,
        },
      },
    }))
  }),

  byEventTicket: publicProcedure.input(z.object({
    eventTicketId: z.string(),
    userId: z.string(),
    userTicketId: z.string().optional(),
  })).query(async ({ ctx, input }) => {
    const { eventTicketId, userId, userTicketId } = input

    const whereClause = userTicketId
      ? { id: userTicketId, ownerId: userId, ticketId: eventTicketId, status: 'PENDING' as const }
      : { ownerId: userId, ticketId: eventTicketId, status: 'PENDING' as const }

    const tickets = await ctx.prisma.userTicket.findMany({
      where: whereClause,
      select: {
        id: true,
        giftId: true,
        ticket: {
          select: {
            event: {
              select: {
                location: { select: { name: true } },
                name: true,
                startsAt: true,
                endsAt: true,
                image: true,
              }
            },
            name: true,
          }
        },
        gift: {
          select: {
            id: true,
            status: true,
            giftReceiverId: true,
            giftRequesterId: true,
            giftRequester: { select: { id: true, name: true, image: true } },
            giftReceiver: { select: { id: true, name: true, image: true } },
          }
        },
      }
    })

    if (!tickets || tickets.length === 0) {
      return {}
    }

    const primaryTicket = tickets[0]!
    const g = primaryTicket.gift
    const isGift = g != null
    const giftStatus = g?.status ?? null
    const isSentGift = isGift && g!.giftRequesterId === userId
    const isGiftBlocking = isGift && (giftStatus === 'PENDING' || giftStatus === 'ACCEPTED')

    return {
      eventTicket: {
        id: eventTicketId,
        locatioName: primaryTicket.ticket.event.location?.name ?? 'Ubicación',
        name: primaryTicket.ticket.name,
        event: {
          name: primaryTicket.ticket.event.name,
          image: primaryTicket.ticket.event.image ?? 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Placeholder_view_vector.svg/1200px-Placeholder_view_vector.svg.png',
          startsAt: primaryTicket.ticket.event.startsAt,
          endsAt: primaryTicket.ticket.event.endsAt,
        },
      },
      url: primaryTicket.id,
      quantity: tickets.length,
      isGift,
      giftStatus,
      giftId: g?.id ?? null,
      isSentGift,
      isGiftBlocking,
      giftSender: !isSentGift && isGift && g?.giftRequester
        ? { id: g.giftRequester.id, name: g.giftRequester.name, image: g.giftRequester.image }
        : null,
      giftReceiver: isSentGift && g?.giftReceiver
        ? { id: g.giftReceiver.id, name: g.giftReceiver.name, image: g.giftReceiver.image }
        : null,
    }
  }),

  use: protectedProcedure.input(z.object({
    url: z.strictObject({
      ticketId: z.string(),
      userId: z.string(),
      eventId: z.string(),
    }),
    eventId: z.string()
  })).mutation(async ({ ctx, input }) => {
    const { url, eventId } = input
    const pass = await ctx.prisma.userTicket.findUnique({
      where: {
        id: url.ticketId
      },
      select: {
        owner: { select: { id: true, userOnEvents: { where: { eventId: url.eventId } } } },
        ticket: { select: { eventId: true, validUntil: true } },
        status: true,
      }
    })

    if (!pass) {
      throw new TRPCError({
        code: 'CONFLICT',
        message: "Ticket no válido"
      });
    } else if (pass.ticket.eventId !== eventId) {
      throw new TRPCError({
        code: 'CONFLICT',
        message: "Este ticket pertenece a otro evento"
      });
    } else if (pass.owner.id !== url.userId) {
      throw new TRPCError({
        code: 'CONFLICT',
        message: "Este ticket no le pertenece a la persona"
      });
    } else if (pass.status !== 'PENDING') {
      if (pass.status === 'ACCEPTED') {
        throw new TRPCError({
          code: 'CONFLICT',
          message: "Este ticket ya fue utilizado"
        });
      } else {
        throw new TRPCError({
          code: 'CONFLICT',
          message: "Ticket no válido"
        });
      }
    }
    // // HAY QUE HACER LAS VALIDADCIONES DE FECHA
    if (true || dayjs().tz('UTC').isSameOrBefore(pass?.ticket.validUntil)) {
      const userTicket = await ctx.prisma.userTicket.update({
        where: {
          id: url.ticketId,
        },
        data: {
          status: 'ACCEPTED'
        },
        select: {
          ownerId: true,
          owner: {
            select: {
              name: true,
            }
          },
          ticket: {
            select: {
              validUntil: true,
              eventId: true,
              about: true,
            }
          }
        }
      })
      if (pass.owner.userOnEvents.length === 0) {
        await ctx.prisma.userOnEvent.create({
          data: {
            userId: userTicket.ownerId,
            eventId: userTicket.ticket.eventId,
          }
        })
      }
      return userTicket
    } else {
      throw new TRPCError({
        code: 'CONFLICT',
        message: "Ticket expirado"
      });
    }
  }),

  create: protectedProcedure.input(CreatePostSchema).mutation(({ ctx, input }) => {
    return
  }),

  update: protectedProcedure.input(CreatePostSchema).mutation(({ ctx, input }) => {
    return
  }),
});
