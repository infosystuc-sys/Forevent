import { CreatePostSchema } from "@forevent/validators";
import { z } from "zod";

import { TRPCError } from "@trpc/server";
import { createTRPCRouter, mobileProtectedProcedure, protectedProcedure, publicProcedure } from "../../trpc";

export const userPurchaseRouter = createTRPCRouter({
  all: publicProcedure.input(z.object({ userId: z.string(), eventId: z.string() })).query(async ({ ctx, input }) => {
    const purchases = await ctx.prisma.userPurchase.findMany({
      where: {
        ownerId: input.userId,
        productOnDeposit: {
          deposit: {
            eventId: input.eventId
          }
        },
        NOT: {
          gifts: {
            some: {
              discharged: true,
              status: 'PENDING'
            }
          }
        },
        discharged: true,
        status: 'PENDING',
      },
      select: {
        id: true,
        productOnDeposit: {
          select: {
            product: {
              select: {
                id: true,
                name: true,
                about: true,
                image: true,
              }
            }
          }
        }
      }
    })

    if (!purchases) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: 'No se encontraron compras para el usuario y evento ingresados.'
      })
    }
    let corrected: {
      ids: string[],
      product: {
        id: string;
        name: string;
        about: string | null;
        image: string | null;
      }
    }[] = []
    purchases.map(item => {
      let exist = false
      corrected.map((corr, index) => {
        if (corr.product?.id === item.productOnDeposit.product?.id) {
          corrected[index]?.ids.push(item.id)
          exist = true
        }
      })
      if (!exist && item.productOnDeposit.product) {
        corrected.push({
          ids: [item.id],
          product: item.productOnDeposit.product,
        })
      }
    })
    return corrected
  }),

  myPurchases: mobileProtectedProcedure.query(async ({ ctx }) => {
    const rows = await ctx.prisma.userPurchase.findMany({
      where: {
        ownerId: ctx.user.id,
        discharged: true,
      },
      select: {
        id: true,
        status: true,
        productOnDeposit: {
          select: {
            product: {
              select: {
                id: true,
                name: true,
                about: true,
                image: true,
                price: true,
                event: {
                  select: {
                    id: true,
                    name: true,
                    image: true,
                    startsAt: true,
                  },
                },
              },
            },
          },
        },
        deal: {
          select: {
            id: true,
            name: true,
            about: true,
            image: true,
            price: true,
            event: {
              select: {
                id: true,
                name: true,
                image: true,
                startsAt: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    const eventMap = new Map<string, {
      eventId: string
      eventName: string
      eventImage: string
      eventStartsAt: Date
      products: {
        userPurchaseIds: string[]
        productId: string
        name: string
        about: string | null
        image: string | null
        price: number
        quantity: number
        status: string
      }[]
    }>()

    for (const row of rows) {
      let productId: string
      let name: string
      let about: string | null
      let image: string | null
      let price: number
      let eventId: string
      let eventName: string
      let eventImage: string
      let eventStartsAt: Date

      if (row.productOnDeposit?.product) {
        const p = row.productOnDeposit.product
        const e = p.event
        productId = p.id
        name = p.name
        about = p.about
        image = p.image
        price = p.price
        eventId = e.id
        eventName = e.name
        eventImage = e.image
        eventStartsAt = e.startsAt
      } else if (row.deal) {
        const d = row.deal
        const e = d.event
        productId = d.id
        name = d.name
        about = d.about ?? null
        image = d.image
        price = d.price
        eventId = e.id
        eventName = e.name
        eventImage = e.image
        eventStartsAt = e.startsAt
      } else {
        continue
      }

      if (!eventMap.has(eventId)) {
        eventMap.set(eventId, {
          eventId,
          eventName,
          eventImage,
          eventStartsAt,
          products: [],
        })
      }

      const group = eventMap.get(eventId)!
      const existing = group.products.find(
        (p) => p.productId === productId && p.status === String(row.status),
      )
      if (existing) {
        existing.quantity++
        existing.userPurchaseIds.push(row.id)
      } else {
        group.products.push({
          userPurchaseIds: [row.id],
          productId,
          name,
          about,
          image,
          price,
          quantity: 1,
          status: String(row.status),
        })
      }
    }

    return Array.from(eventMap.values())
  }),

  byId: publicProcedure.input(z.object({ userPurchaseId: z.string() })).query(async ({ ctx, input }) => {
    const purchase = await ctx.prisma.userPurchase.findUnique({
      where: {
        id: input.userPurchaseId,
        discharged: true,
      },
      select: {
        id: true,
        status: true,
        ownerId: true,
        buyerId: true,
        createdAt: true,
        productOnDeposit: {
          select: {
            product: {
              select: {
                id: true,
                name: true,
                about: true,
                image: true,
                price: true,
                event: {
                  select: {
                    id: true,
                    name: true,
                    image: true,
                    startsAt: true,
                  },
                },
              },
            },
          },
        },
        deal: {
          select: {
            id: true,
            name: true,
            about: true,
            image: true,
            price: true,
            event: {
              select: {
                id: true,
                name: true,
                image: true,
                startsAt: true,
              },
            },
          },
        },
        gifts: {
          where: { discharged: true, status: { "in": ['PENDING', 'ACCEPTED'] } },
          select: {
            id: true,
            status: true,
            giftReceiver: { select: { id: true, name: true, image: true } },
          },
        },
      },
    })

    if (!purchase) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Compra no encontrada',
      })
    }

    return purchase
  }),

  qrInfo: publicProcedure.input(z.object({ userPurchaseId: z.string() })).query(async ({ ctx, input }) => {
    const purchase = await ctx.prisma.userPurchase.findUnique({
      where: {
        id: input.userPurchaseId,
      },
      select: {
        discharged: true,
        productOnDeposit: {
          select: {
            product: {
              select: {
                id: true,
                image: true,
                name: true,
                about: true,
              }
            },
          }
        },
        owner: {
          select: {
            name: true,
            image: true,
          }
        },
        status: true,
      }
    })

    if (!purchase || !purchase.discharged) {
      throw new TRPCError({
        code: 'CONFLICT',
        message: 'QR inválido'
      })
    }

    switch (purchase.status) {
      case "ACCEPTED":
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Este QR ya fue utilizado'
        })
      case "CANCELLED":
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'QR rechazado'
        })
    }
    return purchase
  }),

  ScanQr: publicProcedure.input(z.object({ userPurchaseId: z.string(), employeeId: z.string(), counterId: z.string().optional() })).mutation(async ({ ctx, input }) => {
    const { employeeId, userPurchaseId, counterId } = input

    const employee = await ctx.prisma.userOnGuild.findFirst({
      where: {
        id: employeeId,
        role: 'EMPLOYEE',
        status: 'ACCEPTED',
        discharged: true,
      },
      select: { id: true },
    });

    if (!employee) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Empleado no autorizado',
      });
    }

    const purchase = await ctx.prisma.userPurchase.findUnique({
      where: {
        id: userPurchaseId,
      },
      select: {
        discharged: true,
        productOnDeposit: {
          select: {
            product: {
              select: {
                name: true,
                image: true,
              }
            }
          }
        },
        owner: {
          select: {
            name: true,
            image: true,
          }
        },
        status: true,
      }
    })

    if (!purchase || !purchase.discharged) {
      throw new TRPCError({
        code: 'CONFLICT',
        message: 'QR inválido'
      })
    }

    switch (purchase.status) {
      case "ACCEPTED":
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Este QR ya fue utilizado'
        })
      case "CANCELLED":
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'QR rechazado'
        })
    }
    return await ctx.prisma.userPurchase.update({
      where: {
        id: userPurchaseId
      },
      data: {
        status: 'ACCEPTED',
        cashierId: employeeId,
        counterId: counterId,
      }
    })
  }),

  create: protectedProcedure.input(z.object({

  })).mutation(({ ctx, input }) => {
    return
  }),

  "delete": protectedProcedure.input(z.number()).mutation(({ ctx, input }) => {
    return
  }),
});
