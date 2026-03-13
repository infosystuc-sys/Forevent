import EmployeeCreatedEmailTemplate from "@forevent/ui/employeecreatedemail";
import GuildInviteEmailTemplate from "@forevent/ui/guildinviteemail";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { HOST_URL, NOREPLY_EMAIL, dayjs } from "../../lib/utils";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../../trpc";

export const userOnGuildRouter = createTRPCRouter({
    getEmployees: protectedProcedure.input(
        z.object({
            guildId: z.string(),
        }),
    ).query(async ({ ctx, input }) => {
        const { guildId } = input
        const employees = await ctx.prisma.userOnGuild.findMany({
            where: {
                //role: { notIn: ['OWNER'] },
                //status: "ACCEPTED",
                guildId,
                discharged: true,
            },
            select: {
                id: true,
                user: {
                    select: {
                        id: true,
                        createdAt: true,
                        name: true,
                        image: true,
                        email: true,
                    }
                },
                guild: {
                    select: {
                        id: true,
                        name: true,
                    }
                },
                role: true,
            },
        })

        // console.log(employees, "empleados encontrados!")

        return employees
    }),

    createInvite: protectedProcedure.input(
        z.object({
            email: z.string().email().toLowerCase(),
            guildId: z.string(),
            role: z.enum(["MANAGER", "EMPLOYEE"])
        })
    ).mutation(async ({ ctx, input }) => {
        const body = input
        console.log(input, "yeah buddy!!!")
        const user = await ctx.prisma.user.findUnique({
            where: { email: body.email },
            include: {
                userOnGuilds: true
            }
        })

        if (!user) {
            throw new TRPCError({
                code: 'NOT_FOUND',
                message: 'No existe un usuario con el correo ingresado',
            });
        }

        if (user.userOnGuilds.find(guild => guild.guildId === body.guildId)) {
            throw new TRPCError({
                code: 'CONFLICT',
                message: 'El usuario ya pertenece a la organización',
            });
        }

        const guild = await ctx.prisma.guild.findUnique({ where: { id: body.guildId } })

        if (!guild) {
            throw new TRPCError({
                code: 'NOT_FOUND',
                message: 'La organización ingresada no existe',
            });
        }

        const previousInvite = await ctx.prisma.invite.findFirst({
            where: {
                userId: user.id,
                guildId: guild.id,
                status: "PENDING"
            }
        })

        if (previousInvite) {
            const sendEmail = await ctx.resend.emails.send({
                from: `Forevent <${NOREPLY_EMAIL}>`,
                to: [body.email],
                subject: "Te han invitado a unirte a una organización",
                react: GuildInviteEmailTemplate({ link: `${HOST_URL}/account/invites`, name: user?.name as string, guildName: guild.name })
            })
            if (sendEmail.error) {
                console.error("[createInvite] Resend error (reinvite):", sendEmail.error)
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: `Error al enviar el correo: ${sendEmail.error.message}`,
                })
            }
            return sendEmail
        } else {

            // const token = (Math.floor(Math.random() * 90000) + 10000).toString()

            const invite = await ctx.prisma.invite.create({
                data: {
                    guildId: input.guildId,
                    userId: user.id,
                    role: input.role
                }
            })

            if (!invite) {
                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'Error al crear invitación',
                });
            }

            const sendEmail = await ctx.resend.emails.send({
                from: `Forevent <${NOREPLY_EMAIL}>`,
                to: [body.email],
                subject: "Te han invitado a unirte a una organización",
                react: GuildInviteEmailTemplate({ link: `${HOST_URL}/account/invites`, name: user?.name as string, guildName: guild.name })
            })
            if (sendEmail.error) {
                console.error("[createInvite] Resend error:", sendEmail.error)
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: `Error al enviar el correo: ${sendEmail.error.message}`,
                })
            }
            return sendEmail
        }
    }),

    modifyInvite: publicProcedure.input(
        z.object({
            inviteId: z.string(),
            action: z.string(),
        })
    ).mutation(async ({ ctx, input }) => {
        const body = input

        console.log(input, "yeah buddy!")

        const exists = await ctx.prisma.invite.findUnique({
            where: { id: body.inviteId }
        })

        if (!exists) {
            throw new TRPCError({
                code: 'NOT_FOUND',
                message: 'La invitacion no existe',
            });
        }

        if (body.action === 'discharge') {
            return await ctx.prisma.invite.update({
                where: { id: body.inviteId },
                data: {
                    discharged: false,
                    status: "CANCELLED"
                },
                include: {
                    guild: {
                        select: {
                            id: true,
                            name: true,
                        }
                    }
                }
            })
        }

        const invite = await ctx.prisma.invite.update({
            where: { id: body.inviteId },
            data: {
                status: body.action === 'ACCEPT' ? "ACCEPTED" : "CANCELLED"
            },
            select: {
                id: true,
                status: true,
                userId: true,
                guildId: true,
                createdAt: true,
                guild: {
                    select: {
                        name: true,
                        id: true,
                    }
                },
                role: true
            },

        })

        if (input.action === "CANCELLED") {
            return
        }

        if (!invite) {
            throw new TRPCError({
                code: 'INTERNAL_SERVER_ERROR',
                message: 'Error al modificar invitacion',
            });
        }

        const employee = await ctx.prisma.userOnGuild.create({
            data: {
                role: invite.role,
                guildId: invite.guildId,
                userId: invite.userId,
                status: "ACCEPTED",
                discharged: true
            },
        })

        if (!employee) {
            throw new TRPCError({
                code: 'INTERNAL_SERVER_ERROR',
                message: 'Error al agregar al usuario a la organización',
            });
        }

        console.log(employee, "empleado creado!!")

        return invite
    }),

    getInvite: publicProcedure.input(
        z.object({
            inviteId: z.string()
        })
    ).query(async ({ ctx, input }) => {
        const body = input

        const invite = await ctx.prisma.invite.findUnique({
            where: { id: body.inviteId },
            select: {
                createdAt: true,
                guild: {
                    select: {
                        name: true
                    }
                },
                status: true
            }
        })

        if (!invite) {
            throw new TRPCError({
                code: 'NOT_FOUND',
                message: 'La invitacion no existe',
            });
        }

        switch (invite?.status) {
            case "CANCELLED":
                throw new TRPCError({
                    code: 'CONFLICT',
                    message: 'La invitacion fue cancelada',
                });
                break;
            case "REJECTED":
                throw new TRPCError({
                    code: 'CONFLICT',
                    message: 'La invitacion fue rechazada',
                });
                break;
            case "ACCEPTED":
                throw new TRPCError({
                    code: 'CONFLICT',
                    message: 'La invitacion ya fue aceptada',
                });
                break;
            case "PENDING":
                return invite
            default:
        }


    }),

    getInvites: protectedProcedure.input(
        z.object({
            email: z.string().email().toLowerCase(),
        })
    ).query(async ({ ctx, input }) => {
        const body = input

        const invites = await ctx.prisma.invite.findMany({
            where: { user: { email: body.email }, status: "PENDING", discharged: true },
            include: { guild: true }
        })

        return invites
    }),

    getGuildInvites: protectedProcedure.input(
        z.object({
            guildId: z.string(),
        })
    ).query(async ({ ctx, input }) => {
        const { guildId } = input

        const invites = await ctx.prisma.invite.findMany({
            where: { guildId },
            include: {
                user: {
                    select: {
                        name: true,
                        email: true,
                    }
                }
            }
        })

        console.log(invites, "INVITES")

        return invites
    }),

    byId: publicProcedure.input(z.object({ userId: z.string() })).query(async ({ ctx, input }) => {
        const { userId } = input
        return await ctx.prisma.userOnGuild.findMany({
            where: {
                userId,
                discharged: true,
                role: 'EMPLOYEE'
            },
            select: {
                id: true,
                guild: {
                    select: {
                        id: true,
                        name: true,
                        image: true,
                    }
                },
                role: true,
            }
        })
    }),

});
