import db from "@forevent/db";

import { createEventAction } from "../actions";
import CreateEventForm from "./form";

export default async function NewEventPage() {
  const organizations = await db.guild.findMany({
    select: {
      id: true,
      name: true,
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="mx-auto w-full max-w-3xl rounded-2xl border bg-card p-6 shadow-sm">
      <div className="mb-6 space-y-2">
        <p className="text-xs font-medium uppercase text-muted-foreground">
          Crear evento
        </p>
        <h1 className="text-2xl font-semibold">Nuevo evento</h1>
        <p className="text-sm text-muted-foreground">
          Completa los datos básicos para publicar un evento.
        </p>
      </div>
      <CreateEventForm
        organizations={organizations}
        action={createEventAction}
      />
    </div>
  );
}
