import { TRPCError } from "@trpc/server";
import type { PrismaClient, Role, Status } from "@forevent/db";

/**
 * Helpers de autorización compartidos por los routers web.
 *
 * Reglas (ver TEST/FOREVENT.pdf, §6, §7 y §9):
 * - El Super Usuario (InternalUser activo) tiene acceso global: pasa cualquier chequeo.
 * - El Dueño/Manager sólo opera sobre organizaciones donde tiene un UserOnGuild
 *   ACCEPTED y activo con rol OWNER o MANAGER.
 * - La identidad siempre se toma de la sesión (email), nunca del input.
 */

export const GUILD_ADMIN_ROLES: Role[] = ["OWNER", "MANAGER"];

type Db = Pick<PrismaClient, "internalUser" | "userOnGuild" | "event">;

export async function isStaff(prisma: Db, email: string | null | undefined) {
  if (!email) return false;
  const staff = await prisma.internalUser.findFirst({
    where: { email: email.toLowerCase(), discharged: true },
    select: { id: true },
  });
  return !!staff;
}

export interface GuildAccess {
  /** true si el acceso se concedió por ser Super Usuario. */
  staff: boolean;
  /** Membresía en la organización (null cuando es staff sin membresía). */
  membership: { id: string; role: Role } | null;
}

/**
 * Verifica que el email de la sesión sea Super Usuario o miembro ACCEPTED de `guildId`
 * con alguno de los `roles`. Lanza FORBIDDEN en caso contrario.
 */
export async function assertGuildAccess(
  prisma: Db,
  opts: { email: string | null | undefined; guildId: string; roles?: Role[] },
): Promise<GuildAccess> {
  const { email, guildId } = opts;
  const roles = opts.roles ?? GUILD_ADMIN_ROLES;

  if (!email) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  const membership = await prisma.userOnGuild.findFirst({
    where: {
      guildId,
      status: "ACCEPTED",
      discharged: true,
      role: { in: roles },
      user: { email: email.toLowerCase() },
    },
    select: { id: true, role: true },
  });

  if (membership) return { staff: false, membership };

  if (await isStaff(prisma, email)) return { staff: true, membership: null };

  throw new TRPCError({
    code: "FORBIDDEN",
    message: "No tienes permisos sobre esta organización.",
  });
}

/**
 * Igual que `assertGuildAccess` pero resolviendo la organización a partir de un evento.
 * Devuelve el evento (id, guildId, status) para que el caller no vuelva a consultarlo.
 */
export async function assertEventAccess(
  prisma: Db,
  opts: { email: string | null | undefined; eventId: string; roles?: Role[] },
) {
  const event = await prisma.event.findUnique({
    where: { id: opts.eventId },
    select: { id: true, guildId: true, status: true, discharged: true },
  });
  if (!event || !event.discharged) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Evento no encontrado" });
  }
  const access = await assertGuildAccess(prisma, {
    email: opts.email,
    guildId: event.guildId,
    roles: opts.roles,
  });
  return { event, access };
}

// ─── Máquina de estados de eventos (PDF §8 y §9) ────────────────────────────
//
//   DRAFT ──enviar a aprobación──► PENDING ──aprobar (staff)──► ACCEPTED ⇄ PAUSED
//     ▲                               │                             │
//     └────────── REJECTED ◄──rechazar (staff)                      └──► CANCELLED
//
// El Dueño puede: crear, editar, enviar a aprobación, pausar, reanudar y dar de baja.
// Sólo el Super Usuario puede publicar (PENDING → ACCEPTED) o rechazar.

const OWNER_TRANSITIONS: Record<Status, Status[]> = {
  DRAFT: ["PENDING", "CANCELLED"],
  REJECTED: ["PENDING", "CANCELLED"],
  PENDING: ["DRAFT", "CANCELLED"],
  ACCEPTED: ["PAUSED", "CANCELLED"],
  PAUSED: ["ACCEPTED", "CANCELLED"],
  CANCELLED: [],
};

const STAFF_TRANSITIONS: Record<Status, Status[]> = {
  DRAFT: ["PENDING", "ACCEPTED", "CANCELLED"],
  REJECTED: ["PENDING", "ACCEPTED", "CANCELLED"],
  PENDING: ["ACCEPTED", "REJECTED", "DRAFT", "CANCELLED"],
  ACCEPTED: ["PAUSED", "CANCELLED"],
  PAUSED: ["ACCEPTED", "CANCELLED"],
  CANCELLED: ["DRAFT"],
};

export function canTransitionEvent(from: Status, to: Status, staff: boolean) {
  const table = staff ? STAFF_TRANSITIONS : OWNER_TRANSITIONS;
  return table[from]?.includes(to) ?? false;
}

export function assertEventTransition(from: Status, to: Status, staff: boolean) {
  if (from === to) return;
  if (!canTransitionEvent(from, to, staff)) {
    const msg =
      to === "ACCEPTED" && !staff
        ? "Sólo el equipo de Forevent puede publicar un evento. Envialo a aprobación."
        : `No se puede pasar el evento de ${from} a ${to}.`;
    throw new TRPCError({ code: "FORBIDDEN", message: msg });
  }
}
