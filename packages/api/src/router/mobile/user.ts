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
                        giftsReceiver: {
                            where: {
                                status: 'PENDING',
                                discharged: true,
                            }
                        }
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
            giftCount: profile._count.giftsReceiver,
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

    gifts: publicProcedure.input(z.object({
        userId: z.string()
    })).query(async ({ ctx, input }) => {
        const { userId } = input
        const gifts = await ctx.prisma.gift.findMany({
            where: {
                giftReceiverId: userId,
                status: 'PENDING',
                discharged: true,
                userTicketId: { not: null }
            },
            select: {
                id: true,
                giftRequester: {
                    select: {
                        name: true,
                        image: true,
                    }
                },
                userTicket: {
                    select: {
                        ticket: {
                            select: {
                                name: true,
                                about: true,
                                event: {
                                    select: {
                                        image: true,
                                        startsAt: true,
                                        name: true,
                                        location: {
                                            select: {
                                                name: true,
                                                address: true,
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        })

        return gifts
    }),

    create: protectedProcedure.input(z.object({

    })).mutation(({ ctx, input }) => {
        return
    }),

    friend: publicProcedure.input(z.object({
        userId: z.string()
    })).query(async ({ ctx, input }) => {
        const { userId } = input
        const user = await ctx.prisma.user.findUnique({
            where: {
                id: userId
            },
            select: {
                friendsReceiver: {
                    where: {
                        status: 'ACCEPTED',
                        discharged: true
                    },
                    select: {
                        friendRequester: {
                            select: {
                                id: true,
                                name: true,
                                image: true,
                                email: true,
                            }
                        }
                    }
                },
                friendsRequester: {
                    where: {
                        status: 'ACCEPTED',
                        discharged: true
                    },
                    select: {
                        friendReceiver: {
                            select: {
                                id: true,
                                name: true,
                                image: true,
                                email: true,
                            }
                        }
                    }
                }
            }
        })

        let data: {
            id: string,
            name: string,
            image: string | null,
            email: string,
        }[] = []

        user?.friendsReceiver.map(friend => {
            data.push({
                id: friend.friendRequester.id,
                name: friend.friendRequester.name,
                image: friend.friendRequester.image,
                email: friend.friendRequester.email
            })
        })
        user?.friendsRequester.map(friend => {
            data.push({
                id: friend.friendReceiver.id,
                name: friend.friendReceiver.name,
                image: friend.friendReceiver.image,
                email: friend.friendReceiver.email
            })
        })
        return data
    }),

    delete: protectedProcedure.input(z.number()).mutation(({ ctx, input }) => {
        return
    }),
});
