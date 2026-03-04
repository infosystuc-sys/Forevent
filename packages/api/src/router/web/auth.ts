import RecoverPasswordEmailTemplate from "@forevent/ui/recoverpasswordemail";
import ValidationCodeEmailTemplate from "@forevent/ui/validationcodeemail";
import { TRPCError } from "@trpc/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { HOST_URL, NOREPLY_EMAIL, dayjs } from "../../lib/utils";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../../trpc";

export const authRouter = createTRPCRouter({
    register: publicProcedure.input(
        z.object({
            name: z.string(),
            email: z.string().email().toLowerCase(),
            password: z.string(),
            locale: z.string().optional(),
            zoneinfo: z.string().optional(),
        })
    ).mutation(async ({ ctx, input }) => {
        const body = input

        // console.log(body, 'YEAH BUDDY')

        const exists = await ctx.prisma.user.findUnique({
            where: {
                email: body.email
            }
        })

        if (exists) {
            throw new TRPCError({
                code: 'CONFLICT',
                message: 'Ya existe una cuenta con el correo ingresado.',
            });
        }

        const defaultImage = "https://d1uydgebs34vim.cloudfront.net/static/default.jpg"

        const hashedPassword = await bcrypt.hash(body.password, 12);

        const newUser = await ctx.prisma.user.create({
            data: {
                email: body.email.toLowerCase(),
                password: hashedPassword,
                passwordVerified: true,
                emailVerified: false,
                name: body.name,
                locale: body.locale ?? "es-AR",
                image: defaultImage
            },
            select: {
                id: true
            }
        })

        if (!newUser) {
            throw new TRPCError({
                code: 'INTERNAL_SERVER_ERROR',
                message: 'Error al crear la cuenta.',
            });
        }

        return newUser
    }),

    createValidation: publicProcedure.input(
        z.object({
            email: z.string().email().toLowerCase(),
            type: z.enum(["GUILD", "USER"]),
        })
    ).mutation(async ({ ctx, input }) => {
        console.log(input, "yeah buddy!!!")

        if (input.type === "USER") {

            const exists = await ctx.prisma.user.findUnique({
                where: {
                    email: input.email
                }
            })

            if (!exists) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'El usuario ingresado no existe.',
                });
            }

            if (exists.emailVerified) {
                throw new TRPCError({
                    code: 'CONFLICT',
                    message: 'El correo electronico ya se encuentra verificado.',
                });
            }

            const token = (Math.floor(Math.random() * 90000) + 10000).toString()

            const challenge = await ctx.prisma.authChallenge.create({
                data: {
                    code: token,
                    userId: exists.id
                },
            })

            if (!challenge) {
                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'Error al crear el codigo de verificación.',
                });
            }

            console.log("Intentando enviar mail a:", input.email, "| from:", `Forevent <${NOREPLY_EMAIL}>`, "| code:", token)

            const sendEmail = await ctx.resend.emails.send({
                from: `Forevent <${NOREPLY_EMAIL}>`,
                to: [input.email],
                subject: "Tu código de verificación de Forevent",
                react: ValidationCodeEmailTemplate({ validationCode: token })
            })

            console.log("[createValidation USER] Resultado Resend:", JSON.stringify(sendEmail))

            if (sendEmail.error) {
                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: `Error al enviar el código: ${sendEmail.error.message}`,
                })
            }

            return challenge.id

        } else {

            const exists = await ctx.prisma.guild.findUnique({
                where: {
                    email: input.email
                }
            })

            if (!exists) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'La organización ingresada no existe.',
                });
            }

            if (exists.emailVerified) {
                throw new TRPCError({
                    code: 'CONFLICT',
                    message: 'El correo electronico ya se encuentra verificado.',
                });
            }

            const token = (Math.floor(Math.random() * 90000) + 10000).toString()

            const challenge = await ctx.prisma.authChallenge.create({
                data: {
                    code: token,
                    guildId: exists.id
                },
            })

            if (!challenge) {
                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'Error al crear el codigo de verificación.',
                });
            }

            console.log("Intentando enviar mail a:", input.email, "| from:", `Forevent <${NOREPLY_EMAIL}>`, "| code:", token)

            const sendEmail = await ctx.resend.emails.send({
                from: `Forevent <${NOREPLY_EMAIL}>`,
                to: [input.email],
                subject: "Tu código de verificación de Forevent",
                react: ValidationCodeEmailTemplate({ validationCode: token })
            })

            console.log("[createValidation GUILD] Resultado Resend:", JSON.stringify(sendEmail))

            if (sendEmail.error) {
                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: `Error al enviar el código: ${sendEmail.error.message}`,
                })
            }

            return challenge.id

        }

    }),

    getIsVerified: publicProcedure.input(
        z.object({
            email: z.string().email().toLowerCase(),
            type: z.enum(["GUILD", "USER"]),
        })
    ).query(async ({ ctx, input }) => {
        const body = input

        if (body.type === "GUILD") {
            const exists = await ctx.prisma.guild.findUnique({
                where: {
                    email: body.email
                },
                select: { emailVerified: true }
            })

            if (!exists) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'La organización ingresada no existe.',
                });
            }

            return { ...exists, passwordVerified: true }

        } else {
            const exists = await ctx.prisma.user.findUnique({
                where: {
                    email: body.email
                },
                select: { emailVerified: true, passwordVerified: true }
            })

            if (!exists) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'El usuario ingresado no existe.',
                });
            }

            return exists
        }
    }),

    submitValidation: publicProcedure.input(
        z.object({
            validationId: z.string(),
            code: z.string(),
            type: z.enum(["GUILD", "USER"]),
        })
    ).mutation(async ({ ctx, input }) => {
        const body = input

        console.log(body, "YEAH BUDDY")

        const exists = await ctx.prisma.authChallenge.findUnique({
            where: { id: body.validationId, discharged: true }
        })

        if (!exists) {
            throw new TRPCError({
                code: 'NOT_FOUND',
                message: 'El codigo de verificación no existe o ya fue utilizado.',
            });
        }

        if (exists.code !== body.code) {
            throw new TRPCError({
                code: 'UNAUTHORIZED',
                message: 'El codigo de verificación ingresado es incorrecto.',
            });
        }

        if (dayjs().diff(dayjs(exists.createdAt), 'minute') > 5) {
            throw new TRPCError({
                code: 'CONFLICT',
                message: 'El codigo de verificación ha expirado.',
            });
        }


        if (exists.userId) {

            const updateUser = await ctx.prisma.user.update({
                where: { id: exists.userId },
                data: { emailVerified: true },
                select: { id: true }
            })

            console.log(updateUser, "updated user email verified")

            return updateUser
        } else if (exists.guildId) {

            const updateGuild = await ctx.prisma.guild.update({
                where: { id: exists.guildId },
                data: { emailVerified: true },
                select: { id: true }
            })

            console.log(updateGuild, "updated guild email verified")

            return updateGuild
        }

        const discharge = await ctx.prisma.authChallenge.update({
            where: { id: exists.id },
            data: { discharged: false },
            select: { id: true }
        })

        return discharge
    }),

    restorePassword: publicProcedure.input(
        z.object({
            email: z.string().toLowerCase(),
        })
    ).mutation(async ({ ctx, input }) => {
        const body = input

        console.log(body, 'YEAH BUDDY')

        const exists = await ctx.prisma.user.findUnique({
            where: {
                email: body.email,
            }
        })

        console.log(exists, "exists")

        if (!exists) {
            throw new TRPCError({
                code: 'NOT_FOUND',
                message: 'No existe una cuenta con el correo ingresado.',
            });
        }

        const token = (Math.floor(Math.random() * 90000) + 10000).toString()

        const challenge = await ctx.prisma.authChallenge.create({
            data: {
                code: token,
                userId: exists.id
            },
        })

        if (!challenge) {
            throw new TRPCError({
                code: 'INTERNAL_SERVER_ERROR',
                message: 'Error al crear el codigo de verificación.',
            });
        }


        const sendEmail = await ctx.resend.emails.send({
            from: `Forevent <${NOREPLY_EMAIL}>`,
            to: [body.email],
            subject: "Restaura tu contraseña",
            react: RecoverPasswordEmailTemplate({ link: `${HOST_URL}/newpassword?id=${challenge.id}`, name: exists?.name ?? "" })
        })

        return sendEmail
    }),

    changePassword: protectedProcedure.input(
        z.object({
            email: z.string().email().toLowerCase(),
            password: z.string(),
        })
    ).mutation(async ({ ctx, input }) => {
        const body = input
        const exists = await ctx.prisma.user.findUnique({
            where: {
                email: body.email
            }
        })

        if (!exists) {
            throw new TRPCError({
                code: 'NOT_FOUND',
                message: 'El usuario ingresado no existe.',
            });
        }
        const hashedPassword = await bcrypt.hash(body.password, 12);

        const updateUser = await ctx.prisma.user.update({
            where: { id: exists.id },
            data: {
                password: hashedPassword,
                passwordVerified: true,
            },
            select: {
                id: true
            }
        })

        return updateUser
    }),

    newPassword: publicProcedure.input(
        z.object({
            password: z.string(),
            challengeId: z.string(),
        })
    ).mutation(async ({ ctx, input }) => {
        const body = input

        console.log(body, 'YEAH BUDDY')

        const exists = await ctx.prisma.authChallenge.findUnique({
            where: {
                id: body.challengeId
            }
        })

        if (!exists) {
            throw new TRPCError({
                code: 'NOT_FOUND',
                message: 'La solicitud expiró o ya fue utilizada.',
            });
        }

        if (!exists.userId) {
            throw new TRPCError({
                code: 'NOT_FOUND',
                message: 'La solicitud no contiene un usuario.',
            });
        }

        const hashedPassword = await bcrypt.hash(body.password, 12);

        const updateUser = await ctx.prisma.user.update({
            where: { id: exists.userId },
            data: {
                password: hashedPassword,
                passwordVerified: true,
            },
            select: {
                id: true
            }
        })

        if (!updateUser) {
            throw new TRPCError({
                code: 'INTERNAL_SERVER_ERROR',
                message: 'Error al actualizar contraseña',
            });
        }

        return updateUser
    }),

});