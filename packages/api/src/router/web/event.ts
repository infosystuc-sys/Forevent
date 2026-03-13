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

  byId: publicProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
    console.log("haydidi", input.id)
    const event = await ctx.prisma.event.findUnique({
      where: {
        id: input.id
      },
      include: {
        location: true,
        artists: true,
        products: true,
        guild: {
          select: {
            id: true,
            name: true,
            image: true,
            address: true,
            country: true,
            city: true,
            state: true,
            emailVerified: true,
            status: true,
            createdAt: true
          }
        },
        tickets: {
          include: {
            _count: {
              select: {
                userTicket: true
              }
            },
          }
        },
        counters: true,
        deals: true,
        deposits: {
          include: {
            productsOnDeposit: {
              include: {
                product: true
              }
            }
          }
        },
        gates: {
          select: {
            id: true,
            name: true,
            about: true,
            createdAt: true,
            updatedAt: true,
            employeeOnEvent: {
              select: {
                userOnGuild: {
                  select: {
                    user: {
                      select: {
                        id: true,
                        name: true,
                        image: true
                      }
                    }
                  }
                }
              }
            }
          }
        },
        employees: {
          select: {
            id: true,
            userOnGuild: {
              select: {
                id: true,
                user: {
                  select: {
                    id: true,
                    name: true,
                    image: true
                  }
                }
              }
            }
          }
        },
      }
    })

    if (!event) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Event not found" })
    }

    return event
  }),

  eventSummary: protectedProcedure.input(z.object({ eventId: z.string() })).query(async ({ ctx, input }) => {
    const { eventId } = input

    const event = await ctx.prisma.event.findUnique({
      where: {
        id: input.eventId,
        discharged: true
      },
      include: {
        tickets: {
          where: {
            eventId: input.eventId
          },
          select: {
            name: true,
            price: true,
            quantity: true,
          }
        },
      }
    })

    const salesTotal = await ctx.prisma.purchase.aggregate({
      where: {
        eventId: input.eventId
      },
      _sum: {
        total: true
      }
    })

    const artists = await ctx.prisma.artist.findMany({
      where: {
        eventId
      },
    })

    const postsCount = await ctx.prisma.post.count({
      where: {
        discharged: true,
      }
    })

    const usersCount = await ctx.prisma.userOnEvent.count({
      where: {
        eventId,
        discharged: true
      }
    })

    const employeesOnGates = await ctx.prisma.employeeOnEvent.findMany({
      where: {
        eventId,
        gateId: { not: null },
        counterId: null,
        userOnGuild: {
          discharged: true,
        }
      },
      select: {
        userOnGuildId: true,
      }
    })

    const employeesCount = await ctx.prisma.employeeOnEvent.count({
      where: {
        eventId,
        userOnGuild: {
          discharged: true,
        },
        NOT: employeesOnGates && employeesOnGates.length > 0 ? {
          userOnGuildId: { in: employeesOnGates.map(eog => eog.userOnGuildId ?? '') },
          counterId: { not: null }
        } : undefined
      },
    })

    const countersCount = await ctx.prisma.counter.count({
      where: {
        eventId
      }
    })

    const gatesCount = await ctx.prisma.gate.count({
      where: {
        eventId
      }
    })

    return {
      event,
      salesTotal,
      artists,
      postsCount,
      usersCount,
      employeesCount,
      countersCount,
      gatesCount
    }

  }),

  countersAndGates: publicProcedure.input(z.object({ eventId: z.string() })).query(async ({ ctx, input }) => {
    const event = await ctx.prisma.event.findUnique({
      where: {
        id: input.eventId
      },
      select: {
        counters: true,
        gates: true,
      }
    })

    if (!event) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Datos no encontrados'
      })
    }

    return event
  }),

  counters: publicProcedure.input(z.object({ eventId: z.string() })).query(async ({ ctx, input }) => {
    console.log('eventtt id', input.eventId)
    const event = await ctx.prisma.event.findUnique({
      where: {
        id: input.eventId
      },
      select: {
        counters: true,
      }
    })

    if (!event) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Datos no encontrados'
      })
    }

    return event.counters
  }),

  gates: publicProcedure.input(z.object({ eventId: z.string() })).query(async ({ ctx, input }) => {
    console.log('eventtt id', input.eventId)
    const event = await ctx.prisma.event.findUnique({
      where: {
        id: input.eventId
      },
      select: {
        gates: true,
      }
    })

    if (!event) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Datos no encontrados'
      })
    }

    return event.gates
  }),

  employeesNotOnEvent: publicProcedure.input(z.object({ eventId: z.string() })).query(async ({ ctx, input }) => {
    const event = await ctx.prisma.event.findUnique({
      where: {
        id: input.eventId,
      },
      select: {
        employees: {
          where: {
            discharged: true,
          },
          select: {
            userOnGuildId: true,
          }
        },
        guildId: true,
      }
    })

    if (!event) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Evento no encontrado'
      })
    }
    // console.log("employees on event ids", event.employees)
    const employees = await ctx.prisma.userOnGuild.findMany({
      where: {
        id: { notIn: event.employees.map(emp => emp.userOnGuildId ?? '') },
        guildId: event.guildId,
        discharged: true,
        // role: "EMPLOYEE"
      },
      select: {
        id: true,
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          }
        }
      }
    })
    return employees
  }),

  products: publicProcedure.input(z.object({ eventId: z.string() })).query(async ({ ctx, input }) => {
    const { eventId } = input
    return await ctx.prisma.product.findMany({
      where: {
        eventId,
        discharged: true,
      }
    })
  }),

  deals: publicProcedure.input(z.object({ eventId: z.string() })).query(async ({ ctx, input }) => {
    const { eventId } = input
    return await ctx.prisma.deal.findMany({
      where: {
        eventId,
        discharged: true,
      },
      select: {
        id: true,
        name: true,
        image: true,
        about: true,
        price: true,
        productOnDeal: {
          select: {
            quantity: true,
            product: {
              select: {
                name: true,
                image: true,
                about: true,
              }
            }
          }
        }
      }
    })
  }),

  deposits: publicProcedure.input(z.object({ eventId: z.string() })).query(async ({ ctx, input }) => {
    const { eventId } = input
    return await ctx.prisma.deposit.findMany({
      where: {
        eventId,
      },
      include: {
        productsOnDeposit: {
          select: {
            product: {
              select: {
                name: true,
              }
            },
            quantity: true,

          }
        },
      }
    })
  }),

  byGuildId: publicProcedure.input(z.object({ guildId: z.string(), q: z.optional(z.enum(['ACCEPTED', 'REJECTED', 'CANCELLED', 'PENDING', 'PAST'])) })).query(async ({ ctx, input }) => {
    console.log("quer", input.q)

    const events = await ctx.prisma.event.findMany({
      where: {
        guildId: input.guildId,
        status: input.q !== "PAST" ? input.q : undefined,
        endsAt: input.q === "PAST" ? { lte: new Date() } : undefined
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
    return events
  }),

  create: protectedProcedure.input(z.object({
    guildId: z.string(),
    name: z.string().min(2, { message: "Este campo es requerido" }),
    about: z.string().min(2, { message: "Este campo es requerido" }),
    image: z.string().url().min(2, { message: "Este campo es requerido" }),
    startsAt: z.string(),
    endsAt: z.string(),
    private: z.boolean(),
    location: z.object({
      name: z.string().min(2, { message: "Este campo es requerido" }),
      latitude: z.number().min(-90).max(90, { message: "Este campo es requerido" }),
      longitude: z.number().min(-180).max(180, { message: "Este campo es requerido" }),
      iana: z.string().min(2, { message: "Este campo es requerido" }),
      country: z.string().min(2, { message: "Este campo es requerido" }),
      state: z.string().min(2, { message: "Este campo es requerido" }),
      city: z.string().min(2, { message: "Este campo es requerido" }),
      address: z.string().min(2, { message: "Este campo es requerido" }),
      image: z.string().url().min(2, { message: "Este campo es requerido" }),
    }),
    gates: z.array(
      z.object({
        employees: z.array(
          z.string()
        ),
        name: z.string(),
        about: z.string().optional()
      })
    ).min(1, { message: "Este campo es requerido" }),
    tickets: z.array(
      z.object({
        name: z.string(),
        price: z.number(),
        quantity: z.number(),
        about: z.string().optional(),
        validUntil: z.string().optional()
      })
    ).min(1, { message: "Este campo es requerido" }),
    artists: z.array(
      z.object({
        name: z.string(),
        image: z.string().url()
      })
    ).optional(),
    deposits: z.array(
      z.object({
        name: z.string(),
        about: z.string().optional(),
        counters: z.array(
          z.object({
            employees: z.array(
              z.string()
            ),
            name: z.string(),
            about: z.string().optional()
          })
        ),
        productsOnDeposit: z.array(
          z.object({
            name: z.string(),
            quantity: z.number().int()
          })
        ),
      })
    ).optional(),
    products: z.array(
      z.object({
        name: z.string(),
        type: z.enum(["FOOD", "DRINK", "CONSUMABLE"]),
        image: z.string().url(),
        about: z.string().optional(),
        price: z.number(),
      })
    ).optional(),
  })).mutation(async ({ ctx, input }) => {
    const { about, endsAt, gates, image, location, name, private: priv, startsAt, tickets, artists, deposits, products, guildId } = input
    return await ctx.prisma.$transaction(async (trans) => {
      const loc = await trans.location.create({
        data: location
      })

      const event = await trans.event.create({
        data: {
          name,
          about,
          endsAt: dayjs(endsAt).$d,
          image,
          artists: {
            create: artists
          },
          startsAt: dayjs(startsAt).$d,
          category: 'BAR',
          locationId: loc.id,
          private: priv,
          guildId,
          tickets: {
            createMany: {
              data: tickets.map(ticket => { return ({ name: ticket.name, price: ticket.price, quantity: ticket.quantity, validUntil: ticket.validUntil ? dayjs(ticket.validUntil).toDate() : undefined }) })
            }
          },
          products: {
            createMany: {
              data: products ?? []
            }
          },
          gates: {
            createMany: {
              data: gates.map(gate => {
                return {
                  name: gate.name,
                  about: gate.about,
                }
              })
            }
          },
          deposits: {
            createMany: {
              data: deposits?.map(depo => {
                return {
                  name: depo.name,
                  about: depo.about,
                }
              }) ?? []
            }
          },
        },
        include: {
          deposits: true,
          gates: true,
          products: true,
        }
      })

      let counters: {
        depositId: string;
        eventId: string;
        name: string;
        about?: string | undefined;
        employeesIds: string[]
      }[] = []

      let productOnDepositData: {
        depositId: string,
        quantity: number,
        productId: string,
      }[] = []

      event.deposits.map(eventDep => {
        deposits?.map(dep => {
          if (dep.name === eventDep.name) {
            dep.counters.map(counter => {
              counters.push({
                depositId: eventDep.id,
                name: counter.name,
                about: counter.about,
                eventId: event.id,
                employeesIds: counter.employees
              })
            })
            dep.productsOnDeposit.map(prodOnDep => {
              event.products.map(createdProd => {
                if (prodOnDep.name === createdProd.name) {
                  productOnDepositData.push({
                    depositId: eventDep.id,
                    productId: createdProd.id,
                    quantity: prodOnDep.quantity
                  })
                }
              })
            })
          }
        })
      })

      await trans.counter.createMany({
        data: counters.map(count => {
          let { employeesIds, ...rest } = count
          return rest
        })
      })

      const createdCounters = await trans.counter.findMany({
        where: {
          eventId: event.id
        }
      })

      let employeeOnEventData: {
        counterId?: string,
        gateId?: string,
        eventId: string,
        userOnGuildId: string
      }[] = []

      createdCounters.map(createdCounters => {
        counters.map(counter => {
          if (counter.name === createdCounters.name) {
            counter.employeesIds.map(empId => {
              employeeOnEventData.push({
                eventId: event.id,
                userOnGuildId: empId,
                counterId: createdCounters.id
              })
            })
          }
        })
      })

      event.gates.map(createdGate => {
        gates.map(gate => {
          if (gate.name === createdGate.name) {
            gate.employees.map(empId => {
              employeeOnEventData.push({
                eventId: event.id,
                userOnGuildId: empId,
                gateId: createdGate.id
              })
            })
          }
        })
      })

      await trans.employeeOnEvent.createMany({
        data: employeeOnEventData
      })

      await trans.productOnDeposit.createMany({
        data: productOnDepositData
      })

      return event
    }, { maxWait: 10000, timeout: 10000 })
  }),

  createProduct: protectedProcedure.input(z.object({
    name: z.string(),
    type: z.enum(["FOOD", "DRINK", "CONSUMABLE"]),
    image: z.string().url(),
    about: z.string().optional(),
    price: z.number(),
    eventId: z.string()
  })).mutation(async ({ ctx, input }) => {
    return await ctx.prisma.product.create({
      data: input
    })
  }),

  update: protectedProcedure.input(CreatePostSchema).mutation(({ ctx, input }) => {
    return
  }),

  updateStatus: protectedProcedure.input(z.object({
    eventId: z.string(),
    status: z.nativeEnum(Status),
  })).mutation(async ({ ctx, input }) => {
    const event = await ctx.prisma.event.findUnique({
      where: { id: input.eventId },
      select: { id: true, guildId: true },
    });
    if (!event) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Evento no encontrado" });
    }
    const userOnGuild = await ctx.prisma.userOnGuild.findFirst({
      where: {
        guildId: event.guildId,
        user: { email: ctx.session.user.email ?? undefined },
        discharged: true,
      },
    });
    if (!userOnGuild) {
      throw new TRPCError({ code: "FORBIDDEN", message: "No tienes permiso para modificar este evento" });
    }
    return await ctx.prisma.event.update({
      where: { id: input.eventId },
      data: { status: input.status },
    });
  }),

  delete: protectedProcedure.input(z.number()).mutation(({ ctx, input }) => {
    return
  }),
});
