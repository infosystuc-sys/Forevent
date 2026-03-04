"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import db, { Status } from "@forevent/db";

export async function toggleEventStatus(
  eventId: string,
  currentStatus: Status,
) {
  const nextStatus =
    currentStatus === Status.DRAFT ? Status.ACCEPTED : Status.DRAFT;

  await db.event.update({
    where: { id: eventId },
    data: { status: nextStatus },
  });

  revalidatePath("/admin");
  redirect(
    `/admin?toast=${nextStatus === Status.ACCEPTED ? "published" : "paused"}`,
  );
}
