import { CreatePostSchema } from "@forevent/validators";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure, publicProcedure } from "../../trpc";
import { TRPCError } from "@trpc/server";

export const inviteRouter = createTRPCRouter({
  all: publicProcedure.query(({ ctx }) => {
    // return ctx.db.select().from(schema.post).orderBy(desc(schema.post.id));
    return
  }),

  giftCreate: publicProcedure.input(z.object({
    userPurchasesIds: z.array(z.string()).optional(),
    userTicketsIds: z.array(z.string()).optional(),
    receiverId: z.string().optional(),
    requesterId: z.string(),
    receiverEmail: z.string().optional(),
  })).mutation(async ({ ctx, input }) => {
    const { userPurchasesIds, userTicketsIds, receiverId: userId, requesterId, receiverEmail } = input

    if (!userId && !receiverEmail) {
      throw new TRPCError({
        code: 'CONFLICT',
        message: 'Se necesita un destinatario'
      })
    }

    const receiverId = userId ?? (await ctx.prisma.user.findUnique({
      where:{
        email: receiverEmail
      }
    }))?.id

    if(!receiverId){
      throw new TRPCError({
        code: 'CONFLICT',
        message: 'No se hay usuario con ese email'
      })
    }

    if(receiverId === requesterId){
      throw new TRPCError({
        code: 'CONFLICT',
        message: 'No puedes mandarte regalos a ti mismo'
      })
    }

    if ((!userPurchasesIds && !userTicketsIds) || (userPurchasesIds?.length === 0 && userTicketsIds?.length === 0)) {
      throw new TRPCError({
        code: 'CONFLICT',
        message: 'Tienes que seleccionar lo que quieres regalar'
      })
    }

    const data: {
      giftReceiverId: string,
      giftRequesterId: string,
      status: 'PENDING',
      userPurchaseId?: string,
      userTicketId?: string,
    }[] = []

    userPurchasesIds?.forEach(purchaseId => {
      data.push({
        giftReceiverId: receiverId,
        giftRequesterId: requesterId,
        status: 'PENDING',
        userPurchaseId: purchaseId
      })
    })
    userTicketsIds?.forEach(ticketId => {
      data.push({
        giftReceiverId: receiverId,
        giftRequesterId: requesterId,
        status: 'PENDING',
        userTicketId: ticketId
      })
    })

    await ctx.prisma.$transaction(async (tx) => {
      for (const item of data) {
        const gift = await tx.gift.create({
          data: item,
          select: { id: true, userTicketId: true },
        })
        if (gift.userTicketId) {
          await tx.userTicket.update({
            where: { id: gift.userTicketId },
            data: { giftId: gift.id },
          })
        }
      }
    })

    return { count: data.length }
  }),

  giftCount: publicProcedure.input(z.object({
    eventId: z.string(),
    userId: z.string(),
  })).query(async ({ ctx, input }) => {
    const { eventId, userId } = input
    const count = await ctx.prisma.gift.count({
      where: {
        giftReceiverId: userId,
        discharged: true,
        userPurchase: {
          productOnDeposit: {
            product: {
              eventId
            }
          }
        },
        status: 'PENDING'
      }
    })
    return count
  }),

  giftInvites: publicProcedure.input(z.object({
    userId: z.string(),
    eventId: z.string(),
  })).query(async ({ ctx, input }) => {
    const { eventId, userId } = input

    const gifts = await ctx.prisma.gift.findMany({
      where: {
        giftReceiverId: userId,
        status: 'PENDING',
        userPurchase: {
          productOnDeposit: {
            product: {
              eventId
            }
          }
        },
      },
      select: {
        id: true,
        giftRequester: {
          select: {
            id: true,
            name: true,
            image: true,
          }
        },
        userPurchase: {
          select: {
            id: true,
            productOnDeposit: {
              select: {
                product: {
                  select: {
                    id: true,
                    name: true,
                    image: true,
                    about: true,
                  }
                }
              }
            }
          }
        }
      }
    })

    let data: {
      userId: string,
      userName: string,
      image: string | null,
      data: {
        userPurchasesIds: string[],
        giftsIds: string[],
        id: string,
        image: string | null,
        about: string | null,
        name: string,
      }[]
    }[] = []

    gifts.map(i => {
      let exist: number | undefined
      data.map((d, index) => {
        if (d.userId === i.giftRequester.id) {
          exist = index
        }
      })
      if (exist || exist === 0) {
        let exist2: number | undefined
        data[exist]!.data.map((d, index) => {
          if (d.id === i.userPurchase!.productOnDeposit!.product.id) {
            exist2 = index
          }
        })
        if (exist2 || exist2 === 0) {
          data[exist]!.data[exist2]!.userPurchasesIds.push(i.userPurchase!.id)
          data[exist]!.data[exist2]!.giftsIds.push(i.id)
        } else {
          let product = i.userPurchase!.productOnDeposit!.product
          data[exist]!.data.push({ userPurchasesIds: [i.userPurchase!.id], giftsIds: [i.id], ...product })
        }
      } else {
        let product = i.userPurchase!.productOnDeposit!.product
        data.push({ userId: i.giftRequester.id, userName: i.giftRequester.name, image: i.giftRequester.image, data: [{ userPurchasesIds: [i.userPurchase!.id], giftsIds: [i.id], ...product }] })
      }
    })

    return data
  }),

  giftModify: publicProcedure.input(z.object({
    accept: z.boolean(),
    giftsIds: z.array(z.string()),
    userId: z.string()
  })).mutation(async ({ ctx, input }) => {
    const { accept, giftsIds, userId } = input

    const transaction = await ctx.prisma.$transaction(async (trans) => {
      const gifts = await trans.gift.findMany({
        where: {
          id: { in: giftsIds },
          giftReceiverId: userId,
          discharged: true,
          status: 'PENDING'
        },
        select: {
          userPurchaseId: true,
          userTicketId: true,
        }
      })

      if (gifts.length !== giftsIds.length) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'No se encontrarón todos los regalos'
        })
      }

      await trans.gift.updateMany({
        where: {
          id: { in: giftsIds },
          giftReceiverId: userId
        },
        data: {
          status: accept ? 'ACCEPTED' : 'REJECTED'
        }
      })

      const userPurchasesIds: string[] = []
      const userTicketsIds: string[] = []
      gifts.forEach(gift => {
        if (gift.userPurchaseId) userPurchasesIds.push(gift.userPurchaseId)
        if (gift.userTicketId) userTicketsIds.push(gift.userTicketId)
      })

      // Si REJECTED: limpiar giftId para que el ticket vuelva a "Mis Entradas" del sender
      if (!accept && userTicketsIds.length > 0) {
        await trans.userTicket.updateMany({
          where: { id: { in: userTicketsIds } },
          data: { giftId: null },
        })
      }

      if (accept) {
        if (userPurchasesIds.length > 0) {
          await trans.userPurchase.updateMany({
            where: {
              id: { in: userPurchasesIds }
            },
            data: {
              ownerId: userId
            }
          })
        }
        if (userTicketsIds.length > 0) {
          await trans.userTicket.updateMany({
            where: {
              id: { in: userTicketsIds }
            },
            data: {
              ownerId: userId,
              giftId: null, // Ticket transferido: ya no está "en regalo"
            }
          })
        }
      }
      return { count: giftsIds.length }
    })
    return accept
  }),

  // ─── Cancel a PENDING gift (only the requester can do this) ─────────────────
  giftCancel: publicProcedure.input(z.object({
    giftId:      z.string(),
    requesterId: z.string(),
  })).mutation(async ({ ctx, input }) => {
    const { giftId, requesterId } = input

    const gift = await ctx.prisma.gift.findUnique({
      where: { id: giftId },
      select: { giftRequesterId: true, status: true, userTicketId: true },
    })

    if (!gift) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Regalo no encontrado.' })
    }

    if (gift.giftRequesterId !== requesterId) {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'Solo el remitente puede anular el regalo.' })
    }

    if (gift.status === 'ACCEPTED') {
      throw new TRPCError({
        code: 'CONFLICT',
        message: 'El regalo ya fue aceptado y no puede anularse.',
      })
    }

    await ctx.prisma.$transaction(async (tx) => {
      if (gift.userTicketId) {
        await tx.userTicket.update({
          where: { id: gift.userTicketId },
          data: { giftId: null },
        })
      }
      await tx.gift.delete({ where: { id: giftId } })
    })

    console.log(`[giftCancel] Gift ${giftId} anulado por requesterId=${requesterId}`)
    return { success: true }
  }),

  delete: protectedProcedure.input(z.number()).mutation(({ ctx, input }) => {
    return
  }),
});
