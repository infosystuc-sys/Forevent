import { CreatePostSchema } from "@forevent/validators";
import { z } from "zod";

import { TRPCError } from "@trpc/server";
import { dayjs } from "../../lib/utils";
import { createTRPCRouter, publicProcedure } from "../../trpc";

export const internalRouter = createTRPCRouter({
    stats: publicProcedure.query(async ({ ctx }) => {
        const guilds = await ctx.prisma.guild.count({
            where: {
                discharged: true,
                expiresAt: { gt: dayjs().$d }
            }
        })

        const locations = await ctx.prisma.location.count({
            where: {
                discharged: true,
                status: 'ACCEPTED',
                event: {
                    guild: {
                        discharged: true,
                        expiresAt: { gt: dayjs().$d }
                    }
                }
            }
        })

        const events = await ctx.prisma.event.count({
            where: {
                discharged: true,
                status: { not: 'PENDING' },
                location: {
                    event: {
                        guild: {
                            discharged: true,
                            expiresAt: { gt: dayjs().$d }
                        }
                    }
                }
            }
        })
        const pendingEvents = await ctx.prisma.event.count({
            where: {
                discharged: true,
                status: 'PENDING',
                location: {
                    event: {
                        guild: {
                            discharged: true,
                            expiresAt: { gt: dayjs().$d }
                        }
                    }
                }
            }
        })
        return {
            guilds,
            locations,
            events,
            pendingEvents
        }
    }),

    pendingEvents: publicProcedure.query(async ({ ctx }) => {
        const events = await ctx.prisma.event.findMany({
            where: {
                discharged: true,
                status: 'PENDING',
                location: {
                    event: {
                        guild: {
                            discharged: true,
                            expiresAt: { gt: dayjs().$d }
                        }
                    }
                }
            },
            select: {
                id: true,
                name: true,
                about: true,
                artists: true,
                category: true,
                location: true,
                tickets: true,
                image: true,
            }
        })

        if (!events) {
            throw new TRPCError({
                code: 'NOT_FOUND',
                message: 'No se encontraron eventos'
            })
        }

        return events
    }),

    allGuilds: publicProcedure.query(async ({ ctx }) => {
        const guilds = await ctx.prisma.guild.findMany({
            select: {
                id: true,
                name: true,
                image: true,
                createdAt: true,
                expiresAt: true,
                address: true,
                city: true,
                country: true,
                state: true,
                discharged: true,
                email: true,
                emailVerified: true,
                status: true,
                taxType: true,
                identifier: true,
                identifierType: true,
                phone_number: true,
                usersOnGuild: {
                    include: {
                        _count: true
                    }
                }
            }
        })

        if (!guilds) {
            throw new TRPCError({
                code: 'NOT_FOUND',
                message: 'No se encontraron organizaciones'
            })
        }
        return guilds
    }),

    internalUser: publicProcedure.input(z.object({
        email: z.string().email().toLowerCase(),
    })).query(async ({ ctx, input }) => {
        const user = await ctx.prisma.internalUser.findFirst({
            where: {
                email: input.email,
            },
            select: {
                id: true,
                name: true,
                image: true,
                createdAt: true,
                discharged: true,
                email: true,
                emailVerified: true,
            }
        })

        if (!user) {
            throw new TRPCError({
                code: 'UNAUTHORIZED',
                message: 'No tienes permisos para ver esta información'
            })
        }

        return user
    }),

    pendingLocations: publicProcedure.query(async ({ ctx }) => {
        return await ctx.prisma.location.findMany({
            where: {
                discharged: true,
                status: 'PENDING',
                event: {
                    guild: {
                        discharged: true,
                        expiresAt: { gt: dayjs().$d }
                    }
                }
            }
        })
    }),

    eventById: publicProcedure.input(z.object({
        eventId: z.string()
    })).query(async ({ ctx, input }) => {
        return await ctx.prisma.event.findUnique({
            where: {
                id: input.eventId
            },
            include: {
                artists: true,
                location: {
                    select: {
                        name: true,
                        address: true,
                        city: true,
                        country: true,
                        image: true,
                    }
                },
                tickets: {
                    select: {
                        about: true,
                        name: true,
                        price: true,
                        quantity: true,
                    }
                },
                counters: true,
            }
        })
    }),

    locationById: publicProcedure.input(z.object({
        locationId: z.string()
    })).query(async ({ ctx, input }) => {
        return await ctx.prisma.location.findUnique({
            where: {
                id: input.locationId
            }
        })
    }),

    modifyEvent: publicProcedure.input(z.object({
        id: z.string(),
        status: z.enum(['ACCEPTED', 'REJECTED']),
        name: z.string().optional(),
        about: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
        const { status, id, about, name } = input

        if (status === 'ACCEPTED') {
            return await ctx.prisma.event.update({
                where: {
                    id
                },
                data: {
                    status
                }
            })
        } else {
            if (!name) {
                throw new TRPCError({
                    code: 'CONFLICT',
                    message: 'Se necesita un título'
                })
            }
            return await ctx.prisma.$transaction(async (transactions) => {
                await transactions.review.create({
                    data: {
                        name,
                        about,
                        eventId: id,
                    }
                })
                return await transactions.event.update({
                    where: {
                        id
                    },
                    data: {
                        status
                    }
                })
            })
        }
    }),

    modifyLocation: publicProcedure.input(z.object({
        id: z.string(),
        status: z.enum(['ACCEPTED', 'REJECTED'])
    })).mutation(async ({ ctx, input }) => {
        const { status, id } = input
        return await ctx.prisma.location.update({
            where: {
                id
            },
            data: {
                status
            }
        })
    }),

    create: publicProcedure.input(z.object({

    })).mutation(({ ctx, input }) => {
        return
    }),

    update: publicProcedure.input(CreatePostSchema).mutation(({ ctx, input }) => {
        return
    }),

    delete: publicProcedure.input(z.number()).mutation(({ ctx, input }) => {
        return
    }),
});
