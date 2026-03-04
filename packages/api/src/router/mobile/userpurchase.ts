import { CreatePostSchema } from "@forevent/validators";
import { z } from "zod";

import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../../trpc";

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

  delete: protectedProcedure.input(z.number()).mutation(({ ctx, input }) => {
    return
  }),
});
