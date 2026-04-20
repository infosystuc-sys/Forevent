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

  adminDetail: publicProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
    const event = await ctx.prisma.event.findUnique({
      where: { id: input.id },
      select: {
        id: true,
        name: true,
        about: true,
        image: true,
        status: true,
        startsAt: true,
        endsAt: true,
        location: { select: { name: true, address: true } },
        tickets: {
          select: { id: true, name: true, about: true, price: true, quantity: true, validUntil: true },
        },
        products: {
          select: { id: true, name: true, about: true, image: true, price: true, type: true },
        },
        gates: {
          select: {
            id: true,
            name: true,
            about: true,
            _count: { select: { employeeOnEvent: true } },
          },
        },
        artists: { select: { id: true, name: true, image: true } },
        deposits: {
          select: {
            id: true,
            name: true,
            about: true,
            productsOnDeposit: {
              select: {
                quantity: true,
                product: { select: { name: true } },
              },
            },
            counter: { select: { id: true, name: true, about: true } },
          },
        },
      },
    })

    if (!event) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Event not found" })
    }

    return event
  }),

  byId: publicProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
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
            },
            counter: {
              include: {
                employeeOnEvent: {
                  select: {
                    userOnGuild: {
                      select: { id: true }
                    }
                  }
                }
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

    const [event, salesTotal, artists, postsCount, usersCount, countersCount, gatesCount, employeesOnGates] = await Promise.all([
      ctx.prisma.event.findUnique({
        where: { id: eventId, discharged: true },
        include: {
          tickets: {
            where: { eventId },
            select: { name: true, price: true, quantity: true },
          },
        },
      }),
      ctx.prisma.purchase.aggregate({
        where: { eventId },
        _sum: { total: true },
      }),
      ctx.prisma.artist.findMany({ where: { eventId } }),
      ctx.prisma.post.count({ where: { eventId, discharged: true } }),
      ctx.prisma.userOnEvent.count({ where: { eventId, discharged: true } }),
      ctx.prisma.counter.count({ where: { eventId } }),
      ctx.prisma.gate.count({ where: { eventId } }),
      ctx.prisma.employeeOnEvent.findMany({
        where: { eventId, gateId: { not: null }, counterId: null, userOnGuild: { discharged: true } },
        select: { userOnGuildId: true },
      }),
    ])

    const employeesCount = await ctx.prisma.employeeOnEvent.count({
      where: {
        eventId,
        userOnGuild: { discharged: true },
        NOT: employeesOnGates.length > 0 ? {
          userOnGuildId: { in: employeesOnGates.map(eog => eog.userOnGuildId ?? '') },
          counterId: { not: null },
        } : undefined,
      },
    })

    return { event, salesTotal, artists, postsCount, usersCount, employeesCount, countersCount, gatesCount }
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

  byGuildId: publicProcedure.input(z.object({
    guildId: z.string(),
    q: z.optional(z.enum(['ACCEPTED', 'REJECTED', 'CANCELLED', 'PENDING', 'PAST'])),
    page: z.number().int().min(1).default(1),
    pageSize: z.number().int().min(1).max(100).default(20),
  })).query(async ({ ctx, input }) => {
    const { guildId, q, page, pageSize } = input
    const where = {
      guildId,
      discharged: true,
      status: q !== "PAST" ? q : undefined,
      endsAt: q === "PAST" ? { lte: new Date() } : undefined,
    }
    const [rows, total] = await Promise.all([
      ctx.prisma.event.findMany({
        where,
        select: {
          id: true,
          name: true,
          image: true,
          private: true,
          status: true,
          guildId: true,
          startsAt: true,
          endsAt: true,
          location: {
            select: {
              address: true,
              city: true,
              country: true,
            }
          },
        },
        orderBy: { startsAt: 'desc' },
        take: pageSize,
        skip: (page - 1) * pageSize,
      }),
      ctx.prisma.event.count({ where }),
    ])
    return { rows, total, page, pageSize }
  }),

  create: protectedProcedure.input(z.object({
    guildId: z.string(),
    name: z.string().min(2, { message: "Este campo es requerido" }),
    about: z.string().min(2, { message: "Este campo es requerido" }),
    image: z.string().url().min(2, { message: "Este campo es requerido" }),
    startsAt: z.string(),
    endsAt: z.string(),
    "private": z.boolean(),
    location: z.object({
      name: z.string().min(2, { message: "Este campo es requerido" }),
      latitude: z.number().min(-90).max(90, { message: "Este campo es requerido" }),
      longitude: z.number().min(-180).max(180, { message: "Este campo es requerido" }),
      iana: z.string().min(2, { message: "Este campo es requerido" }),
      country: z.string().min(2, { message: "Este campo es requerido" }),
      state: z.string().min(2, { message: "Este campo es requerido" }),
      city: z.string().min(2, { message: "Este campo es requerido" }),
      address: z.string().min(2, { message: "Este campo es requerido" }),
      image: z.string().url().optional(),
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
        image: z.string().url().optional()
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
    const { about, endsAt, gates, image, location, name, "private": priv, startsAt, tickets, artists, deposits, products, guildId } = input
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
          "private": priv,
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

  update: protectedProcedure.input(z.object({
    eventId: z.string(),
    guildId: z.string(),
    name: z.string().min(2).optional(),
    about: z.string().optional(),
    startsAt: z.string().optional(),
    endsAt: z.string().optional(),
    "private": z.boolean().optional(),
    image: z.string().url().optional(),
  })).mutation(async ({ ctx, input }) => {
    const { eventId, guildId, startsAt, endsAt, ...rest } = input;

    const userOnGuild = await ctx.prisma.userOnGuild.findFirst({
      where: {
        guildId,
        user: { email: ctx.session.user.email ?? undefined },
        discharged: true,
      },
    });
    if (!userOnGuild) {
      throw new TRPCError({ code: "FORBIDDEN", message: "No tienes permiso para modificar este evento" });
    }

    return await ctx.prisma.event.update({
      where: { id: eventId },
      data: {
        ...rest,
        ...(startsAt ? { startsAt: new Date(startsAt) } : {}),
        ...(endsAt ? { endsAt: new Date(endsAt) } : {}),
      },
    });
  }),

  fullUpdate: protectedProcedure.input(z.object({
    eventId: z.string(),
    guildId: z.string(),
    name: z.string().min(2),
    about: z.string().min(2),
    image: z.string().url().optional(),
    startsAt: z.string(),
    endsAt: z.string(),
    "private": z.boolean(),
    location: z.object({
      id: z.string(),
      name: z.string().min(2),
      latitude: z.number(),
      longitude: z.number(),
      iana: z.string().min(2),
      country: z.string().min(2),
      state: z.string().min(2),
      city: z.string().min(2),
      address: z.string().min(2),
      image: z.string().url().optional(),
    }),
    gates: z.array(z.object({
      employees: z.array(z.string()),
      name: z.string(),
      about: z.string().optional(),
    })),
    tickets: z.array(z.object({
      id: z.string().optional(),
      name: z.string(),
      price: z.number(),
      quantity: z.number(),
      about: z.string().optional(),
      validUntil: z.string().optional(),
    })),
    artists: z.array(z.object({
      name: z.string(),
      image: z.string().url().optional(),
    })).optional(),
    deposits: z.array(z.object({
      name: z.string(),
      about: z.string().optional(),
      counters: z.array(z.object({
        employees: z.array(z.string()),
        name: z.string(),
        about: z.string().optional(),
      })),
      productsOnDeposit: z.array(z.object({
        name: z.string(),
        quantity: z.number().int(),
      })),
    })).optional(),
    products: z.array(z.object({
      id: z.string().optional(),
      name: z.string(),
      type: z.enum(["FOOD", "DRINK", "CONSUMABLE"]),
      image: z.string().url(),
      about: z.string().optional(),
      price: z.number(),
    })).optional(),
  })).mutation(async ({ ctx, input }) => {
    const { eventId, guildId, startsAt, endsAt, location, gates, tickets, artists, deposits, products, ...eventFields } = input;

    const userOnGuild = await ctx.prisma.userOnGuild.findFirst({
      where: { guildId, user: { email: ctx.session.user.email ?? undefined }, discharged: true },
    });
    if (!userOnGuild) throw new TRPCError({ code: "FORBIDDEN", message: "No tienes permiso para modificar este evento" });

    const parseUTC = (s: string): Date => new Date(s.length === 16 ? s + 'Z' : s);

    return await ctx.prisma.$transaction(async (trans) => {
      // 1. Update location
      const { id: locationId, ...locationData } = location;
      await trans.location.update({ where: { id: locationId }, data: locationData });

      // 2. Update event fields
      await trans.event.update({
        where: { id: eventId },
        data: { ...eventFields, startsAt: parseUTC(startsAt), endsAt: parseUTC(endsAt) },
      });

      // 3. Gates: delete employee assignments + gates, recreate
      await trans.employeeOnEvent.deleteMany({ where: { eventId, gateId: { not: null } } });
      await trans.gate.deleteMany({ where: { eventId } });

      if (gates.length > 0) {
        await trans.gate.createMany({ data: gates.map(g => ({ name: g.name, about: g.about, eventId })) });
        const createdGates = await trans.gate.findMany({ where: { eventId } });
        const gateEmployees: { eventId: string; userOnGuildId: string; gateId: string }[] = [];
        createdGates.forEach(cg => {
          const g = gates.find(x => x.name === cg.name);
          g?.employees.forEach(empId => gateEmployees.push({ eventId, userOnGuildId: empId, gateId: cg.id }));
        });
        if (gateEmployees.length) await trans.employeeOnEvent.createMany({ data: gateEmployees });
      }

      // 4. Artists: delete all, recreate
      await trans.artist.deleteMany({ where: { eventId } });
      if (artists?.length) {
        await trans.artist.createMany({ data: artists.map(a => ({ name: a.name, image: a.image, eventId })) });
      }

      // 5. Tickets: update existing, create new
      await Promise.all(
        tickets.filter(t => t.id).map(t =>
          trans.eventTicket.update({
            where: { id: t.id! },
            data: {
              name: t.name, price: t.price, quantity: t.quantity,
              about: t.about ?? null,
              validUntil: t.validUntil ? parseUTC(t.validUntil) : null,
            },
          })
        )
      );
      const newTickets = tickets.filter(t => !t.id);
      if (newTickets.length) {
        await trans.eventTicket.createMany({
          data: newTickets.map(t => ({
            name: t.name, price: t.price, quantity: t.quantity,
            about: t.about, eventId,
            validUntil: t.validUntil ? parseUTC(t.validUntil) : undefined,
          })),
        });
      }

      // 6. Products: update existing, create new
      await Promise.all(
        (products ?? []).filter(p => p.id).map(p =>
          trans.product.update({
            where: { id: p.id! },
            data: { name: p.name, type: p.type, image: p.image, about: p.about ?? null, price: p.price },
          })
        )
      );
      const newProducts = (products ?? []).filter(p => !p.id);
      if (newProducts.length) {
        await trans.product.createMany({ data: newProducts.map(({ id: _id, ...p }) => ({ ...p, eventId })) });
      }

      // 7. Deposits/Counters/ProductOnDeposit: delete all, recreate
      await trans.employeeOnEvent.deleteMany({ where: { eventId, counterId: { not: null } } });
      await trans.productOnDeposit.deleteMany({ where: { deposit: { eventId } } });
      await trans.counter.deleteMany({ where: { eventId } });
      await trans.deposit.deleteMany({ where: { eventId } });

      if (deposits?.length) {
        await trans.deposit.createMany({ data: deposits.map(d => ({ name: d.name, about: d.about, eventId })) });
        const createdDeposits = await trans.deposit.findMany({ where: { eventId } });
        const currentProducts = await trans.product.findMany({ where: { eventId } });

        const counterData: { depositId: string; eventId: string; name: string; about?: string; employeesIds: string[] }[] = [];
        const productOnDepositData: { depositId: string; productId: string; quantity: number }[] = [];

        createdDeposits.forEach(cd => {
          const d = deposits.find(x => x.name === cd.name);
          d?.counters.forEach(c => counterData.push({ depositId: cd.id, eventId, name: c.name, about: c.about, employeesIds: c.employees }));
          d?.productsOnDeposit.forEach(pod => {
            const product = currentProducts.find(p => p.name === pod.name);
            if (product) productOnDepositData.push({ depositId: cd.id, productId: product.id, quantity: pod.quantity });
          });
        });

        if (counterData.length) {
          await trans.counter.createMany({ data: counterData.map(({ employeesIds: _, ...c }) => c) });
          const createdCounters = await trans.counter.findMany({ where: { eventId } });
          const counterEmployees: { eventId: string; userOnGuildId: string; counterId: string }[] = [];
          createdCounters.forEach(cc => {
            const c = counterData.find(x => x.name === cc.name);
            c?.employeesIds.forEach(empId => counterEmployees.push({ eventId, userOnGuildId: empId, counterId: cc.id }));
          });
          if (counterEmployees.length) await trans.employeeOnEvent.createMany({ data: counterEmployees });
        }
        if (productOnDepositData.length) await trans.productOnDeposit.createMany({ data: productOnDepositData });
      }

      return { id: eventId };
    }, { maxWait: 10000, timeout: 10000 });
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

  "delete": protectedProcedure.input(z.object({
    eventId: z.string(),
    guildId: z.string(),
  })).mutation(async ({ ctx, input }) => {
    const userOnGuild = await ctx.prisma.userOnGuild.findFirst({
      where: {
        guildId: input.guildId,
        user: { email: ctx.session.user.email ?? undefined },
        discharged: true,
      },
    });
    if (!userOnGuild) {
      throw new TRPCError({ code: "FORBIDDEN", message: "No tienes permiso para eliminar este evento" });
    }
    return await ctx.prisma.event.update({
      where: { id: input.eventId },
      data: { discharged: false },
    });
  }),
});
