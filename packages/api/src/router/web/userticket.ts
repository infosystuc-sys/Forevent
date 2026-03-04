import { CreatePostSchema } from "@forevent/validators";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure, publicProcedure } from "../../trpc";
import { TRPCError } from "@trpc/server";
import { dayjs } from "../../lib/utils";
import { Input } from "@forevent/ui/input";

export const userTicketRouter = createTRPCRouter({
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
    const ticket = await ctx.prisma.userTicket.findMany({
      where: {
        ownerId: input.userId,
        status: "PENDING",
        discharged: true,
      },
      select: {
        id: true,
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
      }
    })
    if (!ticket) {
      return
    }

    type corrected = {
      eventTicket: {
        id: string,
        locatioName: string,
        name: string,
        event: {
          name: string,
          image: string,
          startsAt: Date,
          endsAt: Date,
        }
      },
      url: string,
      quantity: number
    }

    let correctedTickets: corrected[] = []

    ticket.map((tick) => {
      // let encrypt = CryptoJS.AES.encrypt(JSON.stringify({ id, ticketId: tick.id, eventId: tick.ticket.event.id }), this.configService.getOrThrow('SECRET')).toString()
      // console.log("encrypt", encrypt)
      if (correctedTickets && correctedTickets.length > 0) {
        let exist = false
        correctedTickets.map((corr, index) => {
          if (corr.eventTicket.id === tick.ticket.id) {
            correctedTickets[index] = {
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
              quantity: (correctedTickets[index]?.quantity ?? 0) + 1
            }
            exist = true
          }
        })
        if (!exist) {
          correctedTickets.push({
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
            quantity: 1
          })
        }
      } else {
        correctedTickets.push({
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
          quantity: 1
        })
      }
    })

    return correctedTickets
  }),

  byEventTicket: publicProcedure.input(z.object({
    eventTicketId: z.string(),
    userId: z.string(),
  })).query(async ({ ctx, input }) => {
    const { eventTicketId, userId } = input
    let tickets = await ctx.prisma.userTicket.findMany({
      where: {
        ownerId: userId,
        ticketId: eventTicketId,
        status: 'PENDING',
      },
      select: {
        id: true,
        ticket: {
          select: {
            event: {
              select: {
                location: {
                  select: {
                    name: true,
                  }
                },
                name: true,
                startsAt: true,
                endsAt: true,
                image: true,
              }
            },
            name: true,
          }
        }
      }
    })

    if (!tickets || tickets.length === 0) {
      return {}
    }

    return {
      eventTicket: {
        id: eventTicketId,
        locatioName: tickets[0]?.ticket.event.location?.name as string,
        name: tickets[0]?.ticket.name as string,
        event: {
          name: tickets[0]?.ticket.event.name as string,
          image: tickets[0]?.ticket.event.image ?? "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Placeholder_view_vector.svg/1200px-Placeholder_view_vector.svg.png",
          startsAt: tickets[0]?.ticket.event.startsAt as Date,
          endsAt: tickets[0]?.ticket.event.endsAt as Date,
        },
      },
      url: tickets[0]?.id as string,
      quantity: tickets.length
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

  exchanges: protectedProcedure.input(z.object({
    ticketId: z.string(),
    eventId: z.string()
  })).query(async ({ ctx, input }) => {
    const exchanges = await ctx.prisma.userTicket.findMany({
      where: {
        ticketId: input.ticketId,
        gate: {
          eventId: input.eventId
        }
      },
      select: {
        id: true,
        doorkeeper: {
          select: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
              }
            }
          }
        },
        owner: {
          select: {
            id: true,
            name: true,
          }
        },
        gate: {
          select: {
            name: true,
            id: true
          }
        },
      }
    })



    return exchanges
  }),

  create: protectedProcedure.input(z.object({

  })).mutation(({ ctx, input }) => {
    return
  }),

});
