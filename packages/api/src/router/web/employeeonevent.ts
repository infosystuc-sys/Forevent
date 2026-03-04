import { CreatePostSchema } from "@forevent/validators";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure, publicProcedure } from "../../trpc";
import { TRPCError } from "@trpc/server";

export const employeeOnEventRouter = createTRPCRouter({
  all: protectedProcedure.input(z.object({
    eventId: z.string()
  })).query(async ({ ctx, input }) => {

    const allEmployees = await ctx.prisma.employeeOnEvent.findMany({
      where: {
        eventId: input.eventId,
        discharged: true,
      },
      include: {
        userOnGuild: {
          select: {
            user: {
              select: {
                image: true,
                name: true,
              }
            }
          }
        },
        gate: {
          select: {
            name: true,
            about: true
          }
        },
        counter: {
          select: {
            name: true,
            about: true
          }
        }
      }
    })

    // const groupByCategory = allEmployees.reduce((group, employee) => {
    //   const { userOnGuildId } = employee;
    //   group[userOnGuildId] = group[userOnGuildId] ?? [];
    //   group[userOnGuildId].push(employee);
    //   return group;
    // }, {});

    // console.log(groupByCategory, 'categori useronguildid')

    return allEmployees.map(employee => {
      return {
        ...employee,
        gate: employee.gate,
        counter: employee.counter
      }
    })
  }),

  byId: publicProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
    const data = await ctx.prisma.employeeOnEvent.findFirst({
      where: {
        userOnGuildId: input.id,
        discharged: true,
      },
      select: {
        counterId: true,
        gateId: true,
        counter: true,
        gate: true,
        userOnGuild: {
          select: {
            role: true,
            user: {
              select: {
                name: true,
              }
            }
          }
        }
      }
    })
    if (!data) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Empleado no encontrado'
      })
    }
    return data
  }),

  create: publicProcedure.input(z.object({
    gateId: z.string().optional(),
    counterId: z.string().optional(),
    employeesIds: z.array(z.string()),
    eventId: z.string()
  })).mutation(async ({ ctx, input }) => {
    const { counterId, gateId, employeesIds, eventId } = input
    console.log(input, 'inputs')
    return await ctx.prisma.employeeOnEvent.createMany({
      data: employeesIds.map(id => {
        return {
          counterId: counterId,
          gateId: gateId,
          userOnGuildId: id,
          eventId,
        }
      })
    })
  }),

  scans: protectedProcedure.input(z.object({
    userOnGuildId: z.string(),
    eventId: z.string()
  })).query(async ({ ctx, input }) => {

    const employee = await ctx.prisma.employeeOnEvent.findFirst({
      where: {
        userOnGuildId: input.userOnGuildId,
        eventId: input.eventId,
        discharged: true
      },
      select: {
        userOnGuild: {
          select: {
            user: {
              select: {
                name: true,
                email: true,
                image: true,
                about: true,
                discharged: true
              }
            }
          }
        }
      },
    })

    const ticketScans = await ctx.prisma.userTicket.findMany({
      where: {
        doorkeeperId: input.userOnGuildId,
        discharged: true,
      },
      select: {
        ticket: {
          select: {
            name: true,
            id: true,
            price: true,
            about: true,
          }
        },
        gate: {
          select: {
            name: true,
            id: true,
            about: true
          }
        },
        owner: {
          select: {
            name: true,
          }
        }
      }
    })

    const productScans = await ctx.prisma.userPurchase.findMany({
      where: {
        cashierId: input.userOnGuildId,
        discharged: true
      },
      select: {
        productOnDeposit: {
          select: {
            product: {
              select: {
                image: true,
                name: true,
                id: true,
                price: true,
                about: true
              }
            }
          }
        },
        counter: {
          select: {
            name: true,
            id: true,
            about: true
          }
        },
        owner: {
          select: {
            name: true,
          }
        },
      }
    })

    return {
      ...employee,
      tickets: ticketScans,
      products: productScans
    }
  }),



  modifyEmployee: protectedProcedure.input(
    z.object({
      userOnGuildId: z.string(),
      eventId: z.string(),
      discharged: z.boolean().optional(),
      gateId: z.string().optional(),
      counterId: z.string().optional(),
    })
  ).mutation(async ({ ctx, input }) => {
    const body = input
    const data = (({ userOnGuildId: employeeId, ...obj }) => obj)(body)

    console.log(body, 'YEAH BUDDY')

    const employee = await ctx.prisma.employeeOnEvent.findFirst({
      where: {
        userOnGuildId: input.userOnGuildId,
        eventId: input.eventId,
        discharged: true
      }
    })

    if (!employee) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Empleado no encontrado'
      })
    }

    const update = await ctx.prisma.employeeOnEvent.update({
      where: {
        id: employee.id
      },
      data,
      select: {
        id: true
      }
    })

    if (!update) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Error al modificar empleado',
      });
    }

    return update
  }),


  events: publicProcedure.input(z.object({
    employeeId: z.string()
  })).query(async ({ ctx, input }) => {
    const { employeeId } = input
    const events = ctx.prisma.employeeOnEvent.findMany({
      where: {
        userOnGuildId: employeeId,
        discharged: true,
      },
      select: {
        event: {
          select: {
            id: true,
            name: true,
            image: true,
            about: true,
            startsAt: true,
            endsAt: true,
            location: {
              select: {
                name: true,
                address: true,
                city: true,
              }
            },
          }
        },
        counter: {
          select: {
            name: true,
          }
        }
      }
    })

    return events
  }),

  delete: protectedProcedure.input(z.number()).mutation(({ ctx, input }) => {
    return
  }),
});
