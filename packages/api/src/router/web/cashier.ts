import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../../trpc";
import * as z from 'zod'

export const cashierRouter = createTRPCRouter({
    all: publicProcedure.input(z.object({
        counterId: z.string()
    })).query(async ({ ctx, input }) => {
        const products = await ctx.prisma.counter.findUnique({
            where: {
                id: input.counterId
            },
            select: {
                deposit: {
                    select: {
                        productsOnDeposit: {
                            select: {
                                product: {
                                    select: {
                                        name: true,
                                        image: true,
                                        id: true,
                                        price: true,
                                        about: true,
                                        type: true
                                    }
                                }
                            }
                        }
                    }
                },
                event: {
                    select: {
                        deals: {
                            where: {
                                productOnDeal: {
                                    some: {
                                        product: {
                                            productOnDeposit: {
                                                some: {
                                                    deposit: {
                                                        counter: {
                                                            some: {
                                                                id: input.counterId
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            },
                            select: {
                                id: true,
                                name: true,
                                image: true,
                                price: true,
                                about: true,
                                expiresAt: true
                            }
                        }
                    }
                }

                // traer deal
            }
        })

        console.log({ products: products?.deposit.productsOnDeposit ?? [], deals: products?.event.deals ?? [] }, "YEAH BUDDY RES BODY!")

        return { products: products?.deposit.productsOnDeposit ?? [], deals: products?.event.deals ?? [] }
    }),

    events: publicProcedure.input(z.object({
        guildId: z.string(),
        email: z.string().email().toLowerCase()
    })).query(async ({ ctx, input }) => {
        const events = await ctx.prisma.event.findMany({
            where: {
                guildId: input.guildId,
                counters: {
                    some: {
                        employeeOnEvent: {
                            some: {
                                userOnGuild: {
                                    user: {
                                        email: input.email
                                    }
                                }
                            }
                        }
                    }
                }
            },
            include: {
                location: true,
                artists: true,
                tickets: {
                    include: {
                        _count: {
                            select: {
                                userTicket: true
                            }
                        },
                    }
                },
                counters: {
                    select: {
                        id: true
                    }
                }
            }
        })

        if (!events) {
            throw new TRPCError({ code: "NOT_FOUND", message: "No se encontraron eventos" })
        }

        return events
    })
})