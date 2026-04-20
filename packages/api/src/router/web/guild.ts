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
        const now = new Date()

        const [employeeCount, pendingEvents, pastEvents, approvedEvents, rejectedEvents] =
            await Promise.all([
                ctx.prisma.userOnGuild.count({
                    where: { guildId, discharged: true, status: "ACCEPTED" },
                }),
                ctx.prisma.event.count({ where: { guildId, status: "PENDING" } }),
                ctx.prisma.event.count({ where: { guildId, endsAt: { lt: now } } }),
                ctx.prisma.event.count({ where: { guildId, status: "ACCEPTED" } }),
                ctx.prisma.event.count({ where: { guildId, status: "REJECTED" } }),
            ])

        return {
            employeeCount,
            pendingEvents,
            pastEvents,
            approvedEvents,
            rejectedEvents,
        }
    }),

    getGuildSales: protectedProcedure.input(z.object({
        guildId: z.string()
    })).query(async ({ ctx, input }) => {
        const { guildId } = input

        const [totalAgg, eventTotalsAgg, events, productItemGroups, ticketItemGroups] =
            await Promise.all([
                ctx.prisma.purchase.aggregate({
                    _sum: { total: true },
                    where: { event: { guildId } },
                }),
                ctx.prisma.purchase.groupBy({
                    by: ["eventId"],
                    _sum: { total: true },
                    where: { event: { guildId }, eventId: { not: null } },
                }),
                ctx.prisma.event.findMany({
                    where: { guildId },
                    select: { id: true, name: true, image: true },
                }),
                ctx.prisma.itemOnPurchase.groupBy({
                    by: ["productId"],
                    where: {
                        productId: { not: null },
                        purchase: { event: { guildId } },
                    },
                    _sum: { quantity: true },
                }),
                ctx.prisma.itemOnPurchase.groupBy({
                    by: ["eventTicketId"],
                    where: {
                        eventTicketId: { not: null },
                        purchase: { event: { guildId } },
                    },
                    _sum: { quantity: true },
                }),
            ])

        const productIds = productItemGroups
            .map((g) => g.productId)
            .filter((id): id is string => id !== null)
        const ticketIds = ticketItemGroups
            .map((g) => g.eventTicketId)
            .filter((id): id is string => id !== null)

        const [products, tickets] = await Promise.all([
            productIds.length
                ? ctx.prisma.product.findMany({
                    where: { id: { in: productIds } },
                    select: { id: true, price: true },
                })
                : Promise.resolve([] as { id: string; price: number }[]),
            ticketIds.length
                ? ctx.prisma.eventTicket.findMany({
                    where: { id: { in: ticketIds } },
                    select: { id: true, price: true },
                })
                : Promise.resolve([] as { id: string; price: number }[]),
        ])

        const productPriceMap = new Map(products.map((p) => [p.id, p.price]))
        const ticketPriceMap = new Map(tickets.map((t) => [t.id, t.price]))

        const productsSales = productItemGroups.reduce(
            (sum, g) => sum + (productPriceMap.get(g.productId!) ?? 0) * (g._sum.quantity ?? 0),
            0
        )
        const ticketsSales = ticketItemGroups.reduce(
            (sum, g) => sum + (ticketPriceMap.get(g.eventTicketId!) ?? 0) * (g._sum.quantity ?? 0),
            0
        )

        const eventTotalMap = new Map(
            eventTotalsAgg.map((e) => [e.eventId!, e._sum.total ?? 0])
        )

        const eventsTotals = events.map((event) => ({
            name: event.name,
            total: eventTotalMap.get(event.id) ?? 0,
            image: event.image,
            eventId: event.id,
        }))

        return {
            totalGuildSales: totalAgg._sum.total ?? 0,
            productsSales,
            ticketsSales,
            eventsTotals,
        }
    })
});
