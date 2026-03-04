import { randomBytes } from "crypto";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../../trpc";
import { TRPCError } from "@trpc/server";
import bcrypt from "bcryptjs";
import { Resend } from "resend";
import { NOREPLY_EMAIL, dayjs } from "../../lib/utils";
import ValidationCodeEmailTemplate from "@forevent/ui/validationcodeemail";

const BCRYPT_ROUNDS = 12;
const DEFAULT_IMAGE = "https://d1uydgebs34vim.cloudfront.net/static/default.jpg";

const resend = new Resend(process.env.RESEND_API_KEY);

export const authRouter = createTRPCRouter({
  getSession: publicProcedure.query(({ ctx }) => {
    return ctx.session;
  }),
  getSecretMessage: protectedProcedure.query(() => {
    // testing type validation of overridden next-auth Session in @forevent/auth package
    return "you can see this secret message!";
  }),

  validateSession: publicProcedure.input(z.object({
    sessionId: z.string()
  })).mutation(async ({ ctx, input }) => {
    const { sessionId } = input
    const session = await ctx.prisma.session.findUnique({
      where: {
        id: sessionId
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            about: true,
            image: true,
            locale: true,
            zoneinfo: true,
          }
        }
      }
    })

    if (!session) {
      throw new TRPCError({
        code: 'CONFLICT',
        message: 'No hay sessión'
      })
    }

    if (!session.user) {
      throw new TRPCError({
        code: 'CONFLICT',
        message: 'No hay usuario'
      })
    }

    if (dayjs(session.expiresAt).isSameOrBefore(dayjs())) {
      throw new TRPCError({
        code: 'CONFLICT',
        message: 'Sessión expirada'
      })
    }

    return { user: session.user, sessionId }
  }),

  login: publicProcedure.input(
    z.object({
      challengeId: z.string(),
      code: z.string()
    })).mutation(async ({ ctx, input }) => {
      const exists = await ctx.prisma.authChallenge.findUnique({
        where: { id: input.challengeId },
        select: {
          code: true,
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              locale: true,
              image: true,
              about: true,
              zoneinfo: true
            }
          }
        }
      })

      if (!exists || !exists.user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: 'No existe el codigo ingresado.'
        })
      }

      if (exists.code !== input.code) {
        throw new TRPCError({
          code: "CONFLICT",
          message: 'El codigo ingresado es incorrecto.'
        })
      }

      const challenge = await ctx.prisma.authChallenge.update({
        where: {
          id: input.challengeId
        },
        data: { discharged: false },
      })

      if (!challenge) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Error al dar de baja el codigo.',
        });
      }

      const session = await ctx.prisma.session.create({
        data: {
          expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
          userId: exists?.user?.id!
        }
      })

      if (!challenge) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Error al crear sesión.',
        });
      }

      return { user: exists.user, sessionId: session.id }
    }),

  logout: publicProcedure.input(
    z.object({
      userId: z.string(),
      sessionId: z.string(),
    })).mutation(async ({ ctx, input }) => {

      const exists = await ctx.prisma.session.findUnique({
        where: { id: input.sessionId },
      })

      if (!exists) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: 'No existe la sesión ingresada.'
        })
      }

      const discharge = await ctx.prisma.session.update({
        where: {
          id: input.sessionId
        },
        data: {
          expiresAt: new Date(Date.now())
        },
      })

      if (!discharge) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Error al cerrar sesión.',
        });
      }

      return discharge
    }),

  register: publicProcedure.input(z.object({
    email: z.string().email({ message: "Debes ingresar un email" }).toLowerCase(),
    sendAll: z.boolean(),
    sendEvents: z.boolean(),
    sendEmails: z.boolean(),
    fullname: z.string().min(3, { message: "Debes ingresar un nombre" })
  })).mutation(async ({ ctx, input }) => {

    const userExists = await ctx.prisma.user.findUnique({
      where: { email: input.email },
      select: {
        id: true,
        email: true,
      }
    })

    // console.log(userExists, "USER EXISTS?")

    if (userExists) {
      throw new TRPCError({
        code: "CONFLICT",
        message: 'Ya existe una cuenta con el email ingresado.'
      })
    }

    const LOCALE = "es-AR"
    const ZONE_INFO = "America/Argentina/Buenos_Aires"
    const DEFAULT_IMAGE = "https://d1uydgebs34vim.cloudfront.net/static/default.jpg"
    const DEFAULT_PASSWORD = "Hola1234!"
    const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, BCRYPT_ROUNDS);

    const user = await ctx.prisma.user.create(
      {
        data: {
          email: input.email,
          name: input.fullname,
          locale: LOCALE,
          zoneinfo: ZONE_INFO,
          image: DEFAULT_IMAGE,
          notifyAll: input.sendAll,
          notifyEmails: input.sendEmails,
          notifyEvents: input.sendEvents,
          password: hashedPassword
        },
        select: {
          email: true,
          name: true,
          locale: true,
          image: true,
          id: true,
        }
      }
    )

    return user
  }),

  sendCode: publicProcedure.input(z.object({
    email: z.string().email({ message: "Debes ingresar un email" }).toLowerCase(),
  })).mutation(async ({ ctx, input }) => {
    // ── AUTH DEBUG ────────────────────────────────────────────────────────────
    console.log(`\nAUTH DEBUG: Intentando enviar código para ${input.email}`)

    const exists = await ctx.prisma.user.findUnique({
      where: { email: input.email },
      select: { id: true, email: true },
    })

    if (!exists) {
      console.log(`AUTH DEBUG: email ${input.email} → NOT_FOUND en DB`)
      throw new TRPCError({
        code: "NOT_FOUND",
        message: 'No existe una cuenta con el email ingresado. ¿Deseas registrarte?',
      })
    }

    const token = (Math.floor(Math.random() * 90000) + 10000).toString()
    console.log(`AUTH DEBUG: token generado para ${input.email} → challengeId pendiente`)

    const challenge = await ctx.prisma.authChallenge.create({
      data: { code: token, userId: exists.id },
    })

    console.log(`AUTH DEBUG: challenge creado → id=${challenge.id}`)

    let emailError: { message: string; name: string } | null = null;

    try {
      const result = await resend.emails.send({
        from: "Forevent <onboarding@resend.dev>",
        to: [input.email],
        subject: `${token} es tu código de verificación`,
        react: ValidationCodeEmailTemplate({ validationCode: token }),
      });
      emailError = result.error;
    } catch (resendException) {
      console.error("AUTH DEBUG: Resend lanzó excepción →", resendException);
      // Devolvemos el challengeId igual — el código quedó en DB aunque el email
      // falle, lo que permite al usuario reenviar sin crear desafíos duplicados.
      // En desarrollo el email puede fallar pero el OTP está en los logs del server.
      console.warn(`AUTH DEBUG: OTP (solo dev) = ${token}`)
      return challenge.id
    }

    if (emailError) {
      console.error("AUTH DEBUG: Resend error →", emailError.message);
      // Mismo criterio: devolvemos el challengeId para no bloquear al usuario.
      console.warn(`AUTH DEBUG: OTP (solo dev) = ${token}`)
      return challenge.id
    }

    console.log(`AUTH DEBUG: email enviado correctamente a ${input.email}`)
    return challenge.id
  }),

  // ─── Password-based auth ────────────────────────────────────────────────────

  registerWithPassword: publicProcedure.input(z.object({
    email: z.string().email({ message: "Debes ingresar un email válido" }).toLowerCase(),
    password: z.string().min(8, { message: "La contraseña debe tener al menos 8 caracteres" }),
    name: z.string().min(3, { message: "El nombre debe tener al menos 3 caracteres" }),
  })).mutation(async ({ ctx, input }) => {
    const existing = await ctx.prisma.user.findUnique({
      where: { email: input.email },
      select: { id: true },
    });

    if (existing) {
      throw new TRPCError({
        code: "CONFLICT",
        message: "Ya existe una cuenta con ese email.",
      });
    }

    const hashedPassword = await bcrypt.hash(input.password, BCRYPT_ROUNDS);

    const user = await ctx.prisma.user.create({
      data: {
        email: input.email,
        name: input.name,
        password: hashedPassword,
        image: DEFAULT_IMAGE,
        locale: "es-AR",
        zoneinfo: "America/Argentina/Buenos_Aires",
      },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
      },
    });

    return user;
  }),

  loginWithPassword: publicProcedure.input(z.object({
    email: z.string().email({ message: "Debes ingresar un email válido" }).toLowerCase(),
    password: z.string().min(1, { message: "Debes ingresar una contraseña" }),
  })).mutation(async ({ ctx, input }) => {
    const user = await ctx.prisma.user.findUnique({
      where: { email: input.email },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        about: true,
        locale: true,
        zoneinfo: true,
        password: true,
      },
    });

    // Misma respuesta para email inexistente o contraseña incorrecta (evita enumeración de usuarios)
    const INVALID_MSG = "Email o contraseña incorrectos.";

    if (!user) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: INVALID_MSG });
    }

    const passwordMatch = await bcrypt.compare(input.password, user.password);
    if (!passwordMatch) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: INVALID_MSG });
    }

    const session = await ctx.prisma.session.create({
      data: {
        userId: user.id,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30), // 30 días
      },
    });

    const { password: _omit, ...safeUser } = user;
    return { user: safeUser, sessionId: session.id };
  }),

  requestPasswordReset: publicProcedure.input(z.object({
    email: z.string().email({ message: "Debes ingresar un email válido" }).toLowerCase(),
  })).mutation(async ({ ctx, input }) => {
    const user = await ctx.prisma.user.findUnique({
      where: { email: input.email },
      select: { id: true, name: true },
    });

    // Siempre responder éxito para no revelar si el email existe (seguridad)
    if (user) {
      const token = randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

      // Invalidar tokens anteriores del mismo email
      await ctx.prisma.passwordResetToken.deleteMany({
        where: { email: input.email },
      });

      await ctx.prisma.passwordResetToken.create({
        data: { token, email: input.email, expiresAt },
      });

      const resetUrl = `${process.env.AUTH_URL ?? "http://localhost:3000"}/newpassword?token=${token}`;

      try {
        await resend.emails.send({
          from: "Forevent <onboarding@resend.dev>",
          to: [input.email],
          subject: "Restablece tu contraseña - Forevent",
          html: `
            <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
              <h2>Hola, ${user.name}</h2>
              <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta.</p>
              <p>
                <a href="${resetUrl}"
                   style="display:inline-block;padding:12px 24px;background:#000;color:#fff;border-radius:6px;text-decoration:none">
                  Restablecer contraseña
                </a>
              </p>
              <p style="color:#666;font-size:13px">
                Este enlace expira en <strong>1 hora</strong>.<br>
                Si no solicitaste esto, puedes ignorar este correo.
              </p>
            </div>
          `,
        });
      } catch (err) {
        console.error("[requestPasswordReset] Error al enviar email:", err);
      }
    }

    return { success: true };
  }),

  resetPassword: publicProcedure.input(z.object({
    token: z.string().min(1, { message: "Token requerido" }),
    newPassword: z.string().min(8, { message: "La contraseña debe tener al menos 8 caracteres" }),
  })).mutation(async ({ ctx, input }) => {
    const resetToken = await ctx.prisma.passwordResetToken.findUnique({
      where: { token: input.token },
    });

    if (!resetToken || resetToken.used) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "El token es inválido o ya fue utilizado.",
      });
    }

    if (resetToken.expiresAt < new Date()) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "El token ha expirado. Solicita uno nuevo.",
      });
    }

    const hashedPassword = await bcrypt.hash(input.newPassword, BCRYPT_ROUNDS);

    await ctx.prisma.$transaction([
      ctx.prisma.user.update({
        where: { email: resetToken.email },
        data: { password: hashedPassword },
      }),
      ctx.prisma.passwordResetToken.update({
        where: { token: input.token },
        data: { used: true },
      }),
    ]);

    return { success: true };
  }),
});
