"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";

import db, { Status } from "@forevent/db";

import { assertStaffAction } from "~/lib/staff";

/**
 * Publicar / pausar desde el dashboard del Super Usuario.
 * - ACCEPTED → PAUSED (pausar)
 * - cualquier otro estado → ACCEPTED (publicar / reanudar / aprobar)
 * PAUSED es un estado propio (PDF §9); no se reutiliza DRAFT como "pausado".
 */
export async function toggleEventStatus(
  eventId: string,
  currentStatus: Status,
) {
  await assertStaffAction();

  const nextStatus =
    currentStatus === Status.ACCEPTED ? Status.PAUSED : Status.ACCEPTED;

  const updated = await db.event.update({
    where: { id: eventId },
    data: { status: nextStatus },
    select: { guildId: true },
  });

  revalidateTag("admin-dashboard");
  if (updated?.guildId) revalidateTag(`guild-${updated.guildId}`);
  revalidatePath("/admin");
  redirect(
    `/admin?toast=${nextStatus === Status.ACCEPTED ? "published" : "paused"}`,
  );
}
