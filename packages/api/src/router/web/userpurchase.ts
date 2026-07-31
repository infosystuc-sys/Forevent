import { CreatePostSchema } from "@forevent/validators";
import { z } from "zod";

import { TRPCError } from "@trpc/server";
import { createTRPCRouter, employeeProcedure, protectedProcedure, publicProcedure } from "../../trpc";

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
        discharged: true,
        status: 'PENDING',
      },
      select: {
        id: true,
        productOnDeposit: {
          select: {
            id: true,
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

  byId: publicProcedure.input(z.object({ userPurchaseId: z.string() })).query(async ({ ctx, input }) => {
    return await ctx.prisma.userPurchase.findUnique({
      where: {
        id: input.userPurchaseId,
        discharged: true,
      }
    })
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
            id: true,
            product: {
              select: {
                id: true,
                image: true,
                name: true,
                about: true,
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
    return purchase
  }),

  // employeeId/counterId se derivan del empleado autenticado (ctx.employeeId) y de su
  // employeeOnEvent activo, nunca del input — el cliente sólo manda el QR escaneado.
  ScanQr: employeeProcedure.input(z.object({ userPurchaseId: z.string() })).mutation(async ({ ctx, input }) => {
    const { userPurchaseId } = input

    const purchase = await ctx.prisma.userPurchase.findUnique({
      where: {
        id: userPurchaseId,
      },
      select: {
        discharged: true,
        status: true,
        productOnDeposit: {
          select: {
            product: {
              select: {
                name: true,
                image: true,
                event: { select: { id: true } },
              }
            }
          }
        },
        deal: {
          select: {
            name: true,
            image: true,
            event: { select: { id: true } },
          }
        },
        owner: {
          select: {
            name: true,
            image: true,
          }
        },
      }
    })

    if (!purchase || !purchase.discharged) {
      throw new TRPCError({
        code: 'CONFLICT',
        message: 'QR inválido'
      })
    }

    const eventId = purchase.productOnDeposit?.product?.event?.id ?? purchase.deal?.event?.id
    if (!eventId) {
      throw new TRPCError({
        code: 'CONFLICT',
        message: 'QR inválido'
      })
    }

    const employeeOnEvent = await ctx.prisma.employeeOnEvent.findFirst({
      where: {
        eventId,
        discharged: true,
        counterId: { not: null },
        userOnGuildId: ctx.employeeId,
      }
    })

    if (!employeeOnEvent?.counterId) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Usted no puede scanear productos',
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

    const update = await ctx.prisma.userPurchase.updateMany({
      where: {
        id: userPurchaseId,
        status: 'PENDING',
      },
      data: {
        status: 'ACCEPTED',
        cashierId: employeeOnEvent.userOnGuildId,
        counterId: employeeOnEvent.counterId,
      }
    })

    if (update.count === 0) {
      throw new TRPCError({
        code: 'CONFLICT',
        message: 'Este QR ya fue utilizado'
      })
    }

    return update
  }),

  exchanges: protectedProcedure.input(z.object({
    eventId: z.string(),
    productId: z.string(),
  })).query(async ({ ctx, input }) => {
    const exchanges = await ctx.prisma.userPurchase.findMany({
      where: {
        counter: {
          eventId: input.eventId,
        },
        productOnDeposit: {
          productId: input.productId
        }
      },
      select: {
        id: true,
        productOnDeposit: {
          select: {
            product: {
              select: {
                id: true
              }
            }
          }
        },
        counter: {
          select: {
            id: true,
            name: true,
            deposit: {
              select: {
                name: true,
                about: true,
                id: true
              }
            }
          }
        },
        cashier: {
          select: {
            user: {
              select: {
                name: true,
                id: true
              }
            }
          }
        },
        owner: {
          select: {
            name: true,
            id: true,
          }
        },
        deal: {
          select: {
            name: true,
            about: true,
            id: true,
          }
        }
      }
    })

    return exchanges
  }),

  create: protectedProcedure.input(z.object({

  })).mutation(({ ctx, input }) => {
    return
  }),

  "delete": protectedProcedure.input(z.number()).mutation(({ ctx, input }) => {
    return
  }),
});
