import { CreatePostSchema } from "@forevent/validators";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure, publicProcedure } from "../../trpc";
import { TRPCError } from "@trpc/server";

export const userRouter = createTRPCRouter({
    all: publicProcedure.query(({ ctx }) => {
        // return ctx.db.select().from(schema.post).orderBy(desc(schema.post.id));
        return
    }),

    profile: publicProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
        const profile = await ctx.prisma.user.findUnique({
            where: {
                id: input.id
            },
            select: {
                name: true,
                image: true,
                userOnEvents: {
                    take: 1,
                    orderBy: { updatedAt: 'desc' },
                    where: {
                        discharged: true,
                    },
                    select: {
                        event: {
                            select: {
                                id: true,
                                name: true,
                                image: true,
                                location: {
                                    select: {
                                        name: true,
                                        address: true,
                                        city: true,
                                    }
                                }
                            }
                        }
                    }
                },
                friendsReceiver: {
                    where: {
                        status: 'PENDING'
                    }
                },
                _count: {
                    select: {
                        friendsReceiver: {
                            where: {
                                status: 'ACCEPTED',
                                discharged: true,
                            }
                        },
                        friendsRequester: {
                            where: {
                                status: 'ACCEPTED',
                                discharged: true,
                            }
                        },
                        invites: {
                            where: {
                                status: 'PENDING',
                                discharged: true,
                            }
                        },
                    }
                }
            }
        })
        if (!profile) {
            throw new TRPCError({
                code: 'NOT_FOUND',
                message: 'No se encontro el perfil del usuario',
            })
        }

        return {
            user: {
                name: profile.name,
                image: profile.name
            },
            friendsCount: profile._count.friendsReceiver + profile._count.friendsRequester,
            invitesCount: profile._count.invites,
            event: profile.userOnEvents.length > 0 ? profile.userOnEvents[0]?.event : undefined,
            friendRequests: profile.friendsReceiver.length
        }
    }),

    byId: publicProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
        return await ctx.prisma.user.findUnique({
            where: {
                id: input.id
            },
            select: {
                id: true,
                image: true,
                email: true,
                about: true,
                name: true,
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
