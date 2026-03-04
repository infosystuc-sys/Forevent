import { notFound } from "next/navigation";

import db from "@forevent/db";

import { updateEventAction } from "../../actions";
import CreateEventForm from "../../new/form";

function toDatetimeLocal(value: Date) {
  const pad = (num: number) => num.toString().padStart(2, "0");
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(
    value.getDate(),
  )}T${pad(value.getHours())}:${pad(value.getMinutes())}`;
}

export default async function AdminEventEditPage({
  params,
}: {
  params: { id: string };
}) {
  const [event, organizations] = await Promise.all([
    db.event.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        name: true,
        about: true,
        startsAt: true,
        image: true,
        guildId: true,
        location: {
          select: {
            address: true,
            name: true,
          },
        },
        tickets: {
          select: { quantity: true },
        },
      },
    }),
    db.guild.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  if (!event) {
    notFound();
  }

  const capacity = event.tickets.reduce(
    (total, ticket) => total + ticket.quantity,
    0,
  );

  return (
    <div className="mx-auto w-full max-w-3xl rounded-2xl border bg-card p-6 shadow-sm">
      <div className="mb-6 space-y-2">
        <p className="text-xs font-medium uppercase text-muted-foreground">
          Editar evento
        </p>
        <h1 className="text-2xl font-semibold">Editar evento</h1>
        <p className="text-sm text-muted-foreground">
          Actualiza los datos del evento y guarda los cambios.
        </p>
      </div>
      <CreateEventForm
        organizations={organizations}
        action={updateEventAction}
        initialData={{
          id: event.id,
          name: event.name,
          organizationId: event.guildId,
          description: event.about ?? "",
          startsAt: toDatetimeLocal(event.startsAt),
          location: event.location?.address ?? event.location?.name ?? "",
          imageUrl: event.image,
          capacity,
        }}
      />
    </div>
  );
}
