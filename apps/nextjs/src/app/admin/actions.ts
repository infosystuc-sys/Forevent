"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";

import db, { Status } from "@forevent/db";

export async function toggleEventStatus(
  eventId: string,
  currentStatus: Status,
) {
  const nextStatus =
    currentStatus === Status.DRAFT ? Status.ACCEPTED : Status.DRAFT;

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
