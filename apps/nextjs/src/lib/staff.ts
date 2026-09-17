import { auth } from "@forevent/auth";
import db from "@forevent/db";
import { redirect } from "next/navigation";

/**
 * Guard de Super Usuario para la web administrativa (/admin y /internal/v1).
 *
 * El Super Usuario se identifica por email contra `InternalUser` activo, igual
 * que `internalProcedure` en la API, así sirve tanto la sesión de Google como
 * la de usuario/contraseña del panel interno.
 */
export async function getStaff() {
  const session = await auth();
  const email = session?.user?.email?.toLowerCase();
  if (!email) return null;

  return db.internalUser.findFirst({
    where: { email, discharged: true },
    select: { id: true, email: true, name: true },
  });
}

/** Para layouts y páginas: redirige al login interno si no es Super Usuario. */
export async function requireStaff() {
  const staff = await getStaff();
  if (!staff) redirect("/internal");
  return staff;
}

/** Para server actions: lanza en vez de redirigir (los actions no deben navegar en el error). */
export async function assertStaffAction() {
  const staff = await getStaff();
  if (!staff) {
    throw new Error("Esta acción es exclusiva del equipo de Forevent.");
  }
  return staff;
}
