import ConfirmGuildEmailTemplate from "@forevent/ui/confirmguildemail";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { NOREPLY_EMAIL, dayjs } from "../../lib/utils";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../../trpc";

export const guildRouter = createTRPCRouter({
    all: publicProcedure.input(z.object({
        email: z.string().email().toLowerCase()
    })).query(async ({ ctx, input }) => {

        const guilds = await ctx.prisma.userOnGuild.findMany({
            where: {
                user: { email: input.email },
                discharged: true,
                status: "ACCEPTED"
            },
            select: {
                id: true,
                role: true,
                guild: {
                    select: {
                        id: true,
                        name: true,
                        image: true,
                        address: true
                    }
                }
            }
        })

        // console.log(guilds, "guilds!!")

        return guilds
    }),

    byId: publicProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {

        const guild = await ctx.prisma.userOnGuild.findUnique({
            where: { id: input.id },
            select: {
                id: true,
                role: true,
                guild: {
                    select: {
                        id: true,
                        name: true,
                        image: true,
                        address: true
                    }
                }
            }
        })

        // console.log(guilds, "guilds!!")

        return guild
    }),

    getGuilds: protectedProcedure.input(
        z.object({
            email: z.string().email().toLowerCase(),
        }),
    ).query(async ({ ctx, input }) => {
        const email = input.email

        console.log(email, "YEAH BUDDY GET GUILDS!")

        const guilds = await ctx.prisma.userOnGuild.findMany({
            where: {
                user: { email: email },
                status: "ACCEPTED",
                discharged: true,
                guild: { discharged: true }
            },
            select: {
                guild: {
                    select: {
                        id: true,
                        name: true,
                        image: true,
                    },
                },
                role: true
            },
        })

        if (!guilds) {
            throw new TRPCError({
                code: 'NOT_FOUND',
                message: 'No se encontraron organizaciones asociadas a este correo.',
            });
        }

        // console.log(guilds, "guilds!!")

        return guilds.map(({ role, ...obj }) => { return { ...obj.guild, role } })
    }),

    sendGuildConfirmationCode: protectedProcedure.input(
        z.object({
            email: z.string().email().toLowerCase(),
            guildEmail: z.string().email().toLowerCase(),
        })
    ).mutation(async ({ ctx, input }) => {
        const body = input

        const exists = await ctx.prisma.guild.findUnique({
            where: {
                email: body.guildEmail
            }
        })

        if (exists) {
            throw new TRPCError({
                code: 'CONFLICT',
                message: 'Ya existe una organización con ese correo.',
            });
        }

        const user = await ctx.prisma.user.findUnique({
            where: {
                email: body.email
            }
        })

        if (!user) {
            throw new TRPCError({
                code: 'CONFLICT',
                message: 'No existe el usuario que solcita crear la organización.',
            });
        }

        const token = (Math.floor(Math.random() * 90000) + 10000).toString()

        const challenge = await ctx.prisma.authChallenge.create({
            data: {
                code: token,
                userId: user?.id,

            },
        })

        if (!challenge) {
            throw new TRPCError({
                code: 'INTERNAL_SERVER_ERROR',
                message: 'Error al enviar codigo de verificación.',
            });
        }

        const sendEmail = await ctx.resend.emails.send({
            from: `Forevent <${NOREPLY_EMAIL}>`,
            to: [body.email],
            subject: "Confirma el correo de tu organización",
            react: ConfirmGuildEmailTemplate({ validationCode: token })
        })

        return sendEmail
    }),

    createGuild: publicProcedure.input(z.object({
        name: z.string(),
        taxType: z.string(),
        identifier: z.string().max(11).min(8),
        identifierType: z.enum(['DNI', 'CUIT', 'CUIL']),
        email: z.string().toLowerCase(),
        address: z.string(),
        country: z.string(),
        state: z.string(),
        city: z.string(),
        ownerEmail: z.string().email().toLowerCase(),
        image: z.string().url().optional()
    })).mutation(async ({ ctx, input }) => {
        const body = input

        console.log(body, 'YEAH BUDDY')

        const nameUsed = await ctx.prisma.guild.findUnique({
            where: {
                name: body.name
            },
        })

        if (nameUsed) {
            throw new TRPCError({
                code: 'INTERNAL_SERVER_ERROR',
                message: 'Ya existe una organización con ese nombre.',
            });
        }

        const emailUsed = await ctx.prisma.guild.findUnique({
            where: {
                email: body.email
            },
        })

        if (emailUsed) {
            throw new TRPCError({
                code: 'CONFLICT',
                message: 'Ya existe una organización registrada con este correo.',
            });
        }

        const owner = await ctx.prisma.user.findUnique({
            where: {
                email: body.email
            }
        })

        if (!owner) {
            throw new TRPCError({
                code: 'CONFLICT',
                message: 'Dueño de la organización no existe o esta dado de baja.',
            });
        }

        const data = (({ ownerEmail, ...obj }) => obj)(body)

        const guild = await ctx.prisma.guild.create({
            data: {
                ...data,
                expiresAt: dayjs().add(1, 'year').$d,
                userLimit: 100,
                emailVerified: false,
                usersOnGuild: {
                    create: {
                        user: {
                            connect: {
                                email: body.ownerEmail.toLowerCase()
                            }
                        },
                        role: 'OWNER',
                        status: "ACCEPTED"
                    }
                }
            }
        })

        if (!guild) {
            throw new TRPCError({
                code: 'INTERNAL_SERVER_ERROR',
                message: 'Error al crear la organización.',
            });
        }

        return guild
    }),

    getGuildSummary: protectedProcedure.input(
        z.object({
            guildId: z.string(),
            period: z.enum(['LASTWEEK', 'LASTMONTH', 'THREEMONTHS', 'SIXMONTHS', 'LASTYEAR', 'ALLTIME'])
        })
    ).query(async ({ ctx, input }) => {
        const { guildId } = input

        const employeeCount = await ctx.prisma.userOnGuild.count({
            where: {
                guildId,
                discharged: true,
                status: "ACCEPTED"
            },
        })

        const guildEvents = await ctx.prisma.guild.findUnique({
            where: {
                id: input.guildId
            },
            select: {
                events: true
            }
        })

        // pendingEvents, pastEvents, approvedEvents, rejectedEvents
        return {
            employeeCount,
            pendingEvents: guildEvents?.events.filter((event) => event.status === "PENDING").length,
            pastEvents: guildEvents?.events.filter((event) => event.endsAt < new Date()).length,
            approvedEvents: guildEvents?.events.filter((event) => event.status === "ACCEPTED").length,
            rejectedEvents: guildEvents?.events.filter((event) => event.status === "REJECTED").length
        }

    }),

    getGuildSales: protectedProcedure.input(z.object({
        guildId: z.string()
    })).query(async ({ ctx, input }) => {
        //getGuildSales

        const guildSales = await ctx.prisma.guild.findUnique({
            where: {
                id: input.guildId
            },
            select: {
                events: {
                    where: {
                        guildId: input.guildId
                    },
                    select: {
                        purchases: {
                            select: {
                                total: true,
                                id: true,
                                items: {
                                    select: {
                                        quantity: true,
                                        product: {
                                            select: {
                                                price: true,
                                            }
                                        },
                                        eventTicket: {
                                            select: {
                                                price: true
                                            }
                                        }
                                    }
                                }
                            }
                        },
                        name: true,
                        image: true,
                        id: true,
                    },
                },
            }
        })

        let totalGuildSales: number = 0
        const eventsTotals: { name: string, total: number, image: string, eventId: string }[] = []
        let productsSales: number = 0
        let ticketsSales: number = 0

        guildSales?.events.forEach(event => {
            // sumo los totales de los eventos
            event.purchases.forEach(eventPurchase => {
                totalGuildSales += eventPurchase.total ?? 0
                // ciclo para sumar las ventas en tickets y en productos (por item)
                eventPurchase.items.forEach(item => {
                    // si tiene un producto, acumula el precio final de ese item (precio por cantidad)
                    if (item.product) {
                        productsSales += item.product.price * item.quantity
                    }
                    // lo mismo pero con ticket
                    if (item.eventTicket) {
                        ticketsSales += item.eventTicket.price * item.quantity
                    }
                })
            })
            // guardo en el array la info del evento que esta en bucle (current)
            eventsTotals.push({
                name: event.name,
                total: event.purchases.reduce((previousValue, currentValue) => previousValue + (currentValue.total ?? 0), 0),
                image: event.image,
                eventId: event.id
            })
        })

        // if (!eventsTotals || eventsTotals.length < 1) {
        //     return {}
        // }

        return {
            totalGuildSales,
            productsSales,
            ticketsSales,
            eventsTotals
        }

    })
});
