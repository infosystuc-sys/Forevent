import { z } from "zod";
import bcrypt from "bcryptjs";

import { TRPCError } from "@trpc/server";
import { dayjs } from "../../lib/utils";
import { createTRPCRouter, internalProcedure } from "../../trpc";

export const internalRouter = createTRPCRouter({
    stats: internalProcedure.query(async ({ ctx }) => {
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

    pendingEvents: internalProcedure.query(async ({ ctx }) => {
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

    allGuilds: internalProcedure.query(async ({ ctx }) => {
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

    // Devuelve el perfil del Super Usuario de la sesión. La identidad sale de
    // `ctx.staff` (resuelto por internalProcedure), nunca del input.
    internalUser: internalProcedure.query(async ({ ctx }) => {
        const user = await ctx.prisma.internalUser.findFirst({
            where: {
                id: ctx.staff.id,
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

    pendingLocations: internalProcedure.query(async ({ ctx }) => {
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

    eventById: internalProcedure.input(z.object({
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

    locationById: internalProcedure.input(z.object({
        locationId: z.string()
    })).query(async ({ ctx, input }) => {
        return await ctx.prisma.location.findUnique({
            where: {
                id: input.locationId
            }
        })
    }),

    modifyEvent: internalProcedure.input(z.object({
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

    modifyLocation: internalProcedure.input(z.object({
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

    // ─── Super Usuarios (InternalUser) ─────────────────────────────────────
    // Alta y gestión del equipo de Forevent sin tocar la base a mano. Sólo un
    // Super Usuario activo puede operar sobre otros (internalProcedure).

    staffList: internalProcedure.query(async ({ ctx }) => {
        const staff = await ctx.prisma.internalUser.findMany({
            orderBy: [{ discharged: 'desc' }, { createdAt: 'asc' }],
            select: { id: true, name: true, email: true, createdAt: true, discharged: true, image: true },
        })
        return staff.map((s) => ({ ...s, isMe: s.id === ctx.staff.id }))
    }),

    staffCreate: internalProcedure.input(z.object({
        name: z.string().trim().min(2, 'El nombre es requerido'),
        email: z.string().trim().email('Email inválido').toLowerCase(),
        password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
    })).mutation(async ({ ctx, input }) => {
        const exists = await ctx.prisma.internalUser.findUnique({ where: { email: input.email } })
        if (exists) {
            throw new TRPCError({ code: 'CONFLICT', message: 'Ya existe un Super Usuario con ese email.' })
        }
        const password = await bcrypt.hash(input.password, 12)
        return await ctx.prisma.internalUser.create({
            data: {
                name: input.name,
                email: input.email,
                password,
                // La contraseña la definió otro staff: se pide cambiarla en el primer ingreso.
                passwordVerified: false,
                emailVerified: true,
            },
            select: { id: true, email: true },
        })
    }),

    staffSetActive: internalProcedure.input(z.object({
        id: z.string(),
        active: z.boolean(),
    })).mutation(async ({ ctx, input }) => {
        if (input.id === ctx.staff.id && !input.active) {
            throw new TRPCError({ code: 'BAD_REQUEST', message: 'No podés desactivar tu propia cuenta.' })
        }
        if (!input.active) {
            const others = await ctx.prisma.internalUser.count({ where: { discharged: true, id: { not: input.id } } })
            if (others === 0) {
                throw new TRPCError({ code: 'BAD_REQUEST', message: 'Debe quedar al menos un Super Usuario activo.' })
            }
        }
        return await ctx.prisma.internalUser.update({
            where: { id: input.id },
            data: { discharged: input.active },
            select: { id: true, discharged: true },
        })
    }),

    staffResetPassword: internalProcedure.input(z.object({
        id: z.string(),
        password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
    })).mutation(async ({ ctx, input }) => {
        const password = await bcrypt.hash(input.password, 12)
        return await ctx.prisma.internalUser.update({
            where: { id: input.id },
            data: { password, passwordVerified: input.id === ctx.staff.id },
            select: { id: true },
        })
    }),
});
