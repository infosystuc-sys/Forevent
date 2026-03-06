import { CreatePostSchema } from "@forevent/validators";
import { z } from "zod";

import { TRPCError } from "@trpc/server";
import { dayjs } from "../../lib/utils";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../../trpc";
import { Status } from "@forevent/db";

export const eventRouter = createTRPCRouter({
  all: publicProcedure.query(({ ctx }) => {
    // return ctx.db.select().from(schema.post).orderBy(desc(schema.post.id));
    return
  }),

  users: publicProcedure.input(z.object({
    eventId: z.string(),
  })).query(async ({ ctx, input }) => {

    const data = await ctx.prisma.userOnEvent.findMany({
      where: {
        eventId: input.eventId,
      },
      distinct: ['userId'],
      select: {
        id: true,
        user: { select: { id: true, image: true, name: true } }
      }
    })

    return data
  }),

  highlighted: publicProcedure.input(z.object({
    latitude: z.number(),
    longitude: z.number(),
  })).query(async ({ ctx, input }) => {
    const { latitude, longitude } = input

    // Coordenadas (0, 0) significan "sin preferencia de ubicación" —
    // se envían desde el frontend cuando el usuario no otorgó permiso de ubicación.
    // En ese caso (y como fallback), se devuelven los próximos eventos aceptados.
    const hasRealLocation = Math.abs(latitude) > 0.5 || Math.abs(longitude) > 0.5

    const eventSelect = {
      id: true,
      image: true,
      createdAt: true,
      startsAt: true,
      endsAt: true,
      about: true,
      name: true,
      location: {
        select: {
          id: true,
          name: true,
          address: true,
          city: true,
          country: true,
          iana: true,
          image: true,
          latitude: true,
          longitude: true,
          staticMap: true,
          createdAt: true,
        }
      },
      artists: {
        select: { id: true, name: true, image: true }
      },
      tickets: {
        orderBy: { price: 'asc' as const },
        where: { discharged: true },
        select: {
          id: true,
          name: true,
          about: true,
          price: true,
          quantity: true,
          validUntil: true,
          createdAt: true,
        }
      },
    }

    const baseWhere = {
      discharged: true,
      private: false,
      status: "ACCEPTED" as const,
    }

    // Con coordenadas reales: intentar mostrar eventos cercanos primero
    if (hasRealLocation) {
      const nearby = await ctx.prisma.event.findMany({
        take: 6,
        orderBy: { startsAt: 'asc' },
        where: {
          ...baseWhere,
          location: {
            latitude:  { lte: latitude  + 0.5, gte: latitude  - 0.5 },
            longitude: { lte: longitude + 0.5, gte: longitude - 0.5 },
          },
        },
        select: eventSelect,
      })
      if (nearby.length > 0) return nearby
    }

    // Fallback: próximos eventos aceptados sin restricción geográfica
    return ctx.prisma.event.findMany({
      take: 6,
      orderBy: { startsAt: 'asc' },
      where: baseWhere,
      select: eventSelect,
    })
  }),

  trending: publicProcedure.input(z.object({
    longitude: z.number()
  })).query(async ({ ctx, input }) => {
    const { longitude } = input

    let longitudeConditional: any = {}
    if (longitude > -179.8 && longitude > 179.8) {
      longitudeConditional['longitude'] = {
        lte: longitude + 0.2,
        gte: longitude - 0.2
      }
    } else if (longitude >= 179.8) {
      longitudeConditional['OR'] = [{
        longitude: {
          lte: 180,
          gte: longitude - 0.2
        }
      },
      {
        longitude: {
          lte: ((longitude + 0.2) - 180) * -1,
          gte: -180,
        }
      }]
    } else if (longitude <= -179.8) {
      let a: any = {
        longitude: {
          lte: 180,
          gte: ((longitude - 0.2) + 180) * -1,
        }
      }
      if (longitude === -179.8) {
        a = { longitude: 180 }
      }
      longitudeConditional['OR'] = [{
        longitude: {
          lte: longitude + 0.2,
          gte: -180
        }
      }, a]
    }
    const data = await ctx.prisma.event.findMany({
      where: {
        discharged: true,
        private: false,
        status: "ACCEPTED",
        // location: {
        //     AND: [
        //         longitudeConditional,
        //         {
        //             latitude: {
        //                 lte: latitude + 0.2,
        //                 gte: latitude - 0.2
        //             }
        //         }
        //     ]
        // },
      },
      select: {
        id: true,
        tickets: {
          where: { discharged: true },
          include: {
            _count: {
              select: {
                userTicket: true,
              }
            }
          }
        },
      }
    })
    console.log(data, "DATT")
    let eventC: any = []
    data.map(d => {
      let usersCount = 0
      d.tickets.map(t => {
        usersCount += t._count.userTicket
      })
      eventC.push({
        eventId: d.id,
        usersCount
      })
    })

    eventC.sort((a: any, b: any) => b.usersCount - a.usersCount)
    let eventsIds = eventC.slice(0, 5).map((e: any) => e.eventId)

    return await ctx.prisma.event.findMany({
      where: {
        id: { in: eventsIds }
      },
      select: {
        id: true,
        image: true,
        createdAt: true,
        startsAt: true,
        endsAt: true,
        about: true,
        name: true,
        location: {
          select: {
            address: true,
            image: true,
            city: true,
            country: true,
            iana: true,
            latitude: true,
            longitude: true,
            id: true,
            name: true,
            createdAt: true,
            staticMap: true,
          }
        },
        artists: {
          select: {
            image: true,
            name: true,
            id: true
          }
        },
        tickets: {
          orderBy: { price: 'desc' },
          where: { discharged: true },
          select: {
            id: true,
            about: true,
            createdAt: true,
            name: true,
            price: true,
            quantity: true,
            validUntil: true,
          }
        },
      }
    })
  }),

  byId: publicProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
    console.log("haydidi", input.id)
    return await ctx.prisma.event.findUnique({
      where: {
        id: input.id
      },
      include: {
        location: true,
        artists: true,
        tickets: {
          include: {
            _count: {
              select: {
                userTicket: true
              }
            },
          }
        },
      }
    })
  }),

  byCategory: publicProcedure.input(z.object({
    latitude: z.number(),
    longitude: z.number(),
    take: z.number(),
    type: z.enum(["TRENDING", "TONIGHT", "THISWEEK", "SPEED", "PRIVATE", "CULTURAL", "BAR",]),
    page: z.string(),
  })).query(async ({ ctx, input }) => {
    let { latitude, longitude, page, take, type } = input
    const cursorObj = page === "" ? undefined : { id: page }
    const now = dayjs()
    let whereData: any = {}

    switch (type) {
      case 'TRENDING':
        console.log('TRENDING', type)
        whereData = {
          createdAt: {
            lte: now.toDate(),
            gte: now.subtract(2, "day").toDate()
          },
        }
        break;
      case 'THISWEEK':
        console.log('THIS WEEK EVENT', type)
        whereData = {
          startsAt: {
            gte: now.toDate(),
            lte: now.add(7, "day").toDate()
          }
        }
        break;
      case 'TONIGHT':
        console.log('TO NIGHT EVENT', type)
        whereData = {
          startsAt: {
            gte: now.toDate(),
            lte: now.add(20, "hours").toDate()
          }
        }
        break;
      case 'BAR':
        console.log('BAR EVENT', type)
        whereData = {
          category: 'BAR'
        }
        break;
      case 'CULTURAL':
        console.log('CULTURAL EVENT', type)
        whereData = {
          category: 'CULTURAL'
        }
        break;
      default:
    }

    let longitudeConditional: any = {}
    if (longitude > -179.8 && longitude > 179.8) {
      longitudeConditional['longitude'] = {
        lte: longitude + 0.2,
        gte: longitude - 0.2
      }
    } else if (longitude >= 179.8) {
      longitudeConditional['OR'] = [{
        longitude: {
          lte: 180,
          gte: longitude - 0.2
        }
      },
      {
        longitude: {
          lte: ((longitude + 0.2) - 180) * -1,
          gte: -180,
        }
      }]
    } else if (longitude <= -179.8) {
      let a: any = {
        longitude: {
          lte: 180,
          gte: ((longitude - 0.2) + 180) * -1,
        }
      }
      if (longitude = -179.8) {
        a = { longitude: 180 }
      }
      longitudeConditional['OR'] = [{
        longitude: {
          lte: longitude + 0.2,
          gte: -180
        }
      }, a]
    }

    const events = await ctx.prisma.event.findMany({
      take: take,
      where: {
        // ...whereData,
        status: "ACCEPTED",
        private: false,
        discharged: true,
      },
      select: {
        id: true,
        image: true,
        createdAt: true,
        startsAt: true,
        endsAt: true,
        about: true,
        name: true,
        location: {
          select: {
            address: true,
            image: true,
            city: true,
            country: true,
            iana: true,
            latitude: true,
            longitude: true,
            id: true,
            name: true,
            createdAt: true,
            staticMap: true,
          }
        },
        artists: {
          select: {
            image: true,
            name: true,
            id: true
          }
        },
        tickets: {
          orderBy: { price: 'desc' },
          where: { discharged: true },
          select: {
            id: true,
            about: true,
            createdAt: true,
            name: true,
            price: true,
            quantity: true,
            validUntil: true,
          }
        },
      }
    })
    console.log(events)
    return events
  }),

  enter: publicProcedure.input(z.object({
    userId: z.string(),
    userTicketId: z.string(),
  })).mutation(async ({ ctx, input }) => {
    const { userId, userTicketId } = input

    const ticket = await ctx.prisma.userTicket.findUnique({
      where: {
        id: userTicketId,
      },
      select: {
        ownerId: true,
        status: true,
        ticket: {
          select: {
            eventId: true,
          }
        }
      }
    })

    if (!ticket) {
      throw new TRPCError({
        code: 'CONFLICT',
        message: 'Ocurrió un error'
      })
    }

    if (ticket.status === 'ACCEPTED') {
      throw new TRPCError({
        code: 'CONFLICT',
        message: 'Esta entrada ya fue utilizada'
      })
    } else if (ticket.status !== 'PENDING') {
      throw new TRPCError({
        code: 'CONFLICT',
        message: 'Entrada invalida'
      })
    }

    if (ticket.ownerId !== userId) {
      throw new TRPCError({
        code: 'CONFLICT',
        message: 'Esta entrada pertenece a otro usuario'
      })
    }

    const userOnEvent = await ctx.prisma.userOnEvent.findMany({
      where: {
        userId,
        eventId: ticket.ticket.eventId,
        discharged: true,
      }
    })

    if (userOnEvent && userOnEvent.length > 0) {
      await ctx.prisma.userOnEvent.updateMany({
        where: {
          userId,
          eventId: ticket.ticket.eventId,
          discharged: true,
        },
        data: {
          updatedAt: new Date()
        }
      })

      return (await ctx.prisma.userTicket.update({
        where: {
          id: userTicketId,
        },
        data: {
          status: 'ACCEPTED'
        },
        select: {
          ticket: {
            select: {
              eventId: true
            }
          }
        }
      })).ticket
    }

    return await ctx.prisma.$transaction(async (transaction) => {
      let update = await transaction.userTicket.update({
        where: {
          id: userTicketId,
        },
        data: {
          status: 'ACCEPTED'
        }
      })

      if (!update) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Ocurrió un error'
        })
      }

      return transaction.userOnEvent.create({
        data: {
          userId,
          eventId: ticket.ticket.eventId,
        },
        select: {
          eventId: true
        }
      })
    })
  }),

  scanTicket: publicProcedure.input(z.object({
    eventId: z.string(),
    userOnGuildId: z.string(),
    userTicketId: z.string(),
    userId: z.string()
  })).mutation(async ({ ctx, input }) => {
    const { userOnGuildId, eventId, userId, userTicketId } = input
    const employeeOnEvent = await ctx.prisma.employeeOnEvent.findFirst({
      where: {
        userOnGuildId,
        eventId,
        discharged: true,
      }
    })
    if (!employeeOnEvent?.gateId) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Usted no puede scanear entradas'
      })
    }

    const userTicket = await ctx.prisma.userTicket.findUnique({
      where: {
        id: userTicketId,
      }
    })

    if (!userTicket || !userTicket.discharged) {
      throw new TRPCError({
        code: 'CONFLICT',
        message: 'Entrada no válida'
      })
    }
    if (userTicket.ownerId !== userId) {
      throw new TRPCError({
        code: 'CONFLICT',
        message: 'La entrada le pertenece a otra persona'
      })
    }

    if (userTicket.status === "ACCEPTED") {
      throw new TRPCError({
        code: 'CONFLICT',
        message: 'La entrada ya fue utilizada'
      })
    }
    if (userTicket.status !== "PENDING") {
      throw new TRPCError({
        code: 'CONFLICT',
        message: 'Entrada no válida'
      })
    }
    const update = await ctx.prisma.userTicket.update({
      where: {
        id: userTicketId
      },
      data: {
        status: 'ACCEPTED'
      }
    })

    ctx.socket.connect()
    ctx.socket.emit('response', {
      message: 'Entraste al evento',
      code: 'SUCCESS'
    });

    ctx.socket.disconnect()

    return update
  }),

  scanProducts: publicProcedure.input(z.object({
    userProductsIds: z.array(z.string()),
    userOnGuildId: z.string(),
    eventId: z.string(),
    userId: z.string()
  })).mutation(async ({ ctx, input }) => {
    const { userOnGuildId, eventId, userId, userProductsIds } = input

    const employeeOnEvent = await ctx.prisma.employeeOnEvent.findFirst({
      where: {
        userOnGuildId,
        eventId,
        discharged: true,
      }
    })
    if (!employeeOnEvent?.counterId) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Usted no puede scanear productos'
      })
    }

    const userProducts = await ctx.prisma.userPurchase.findMany({
      where: {
        id: { in: userProductsIds }
      }
    })

    userProducts.map((prod) => {
      if (prod.status === 'ACCEPTED') {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Hay productos ya reclamados'
        })
      }
      if (prod.status !== 'PENDING' || !prod.discharged) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Algunos productos no son válidos'
        })
      }
      if (prod.buyerId !== userId) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Algunos productos no pertenecen a la persona'
        })
      }
    })

    return await ctx.prisma.userPurchase.updateMany({
      where: {
        id: { in: userProductsIds }
      },
      data: {
        status: 'ACCEPTED',
        cashierId: userOnGuildId
      }
    })
  }),

  create: protectedProcedure.input(z.object({

  })).mutation(({ ctx, input }) => {
    return
  }),

  delete: protectedProcedure.input(z.number()).mutation(({ ctx, input }) => {
    return
  }),
});
