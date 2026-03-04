import db, { type Prisma, Status } from "@forevent/db";
import { Button } from "@forevent/ui/button";
import { Input } from "@forevent/ui/input";
import { Label } from "@forevent/ui/label";
import { PauseCircle, PlayCircle } from "lucide-react";
import Link from "next/link";

import { toggleEventStatus } from "./actions";
import { deleteEventAction } from "./events/actions";
import DeleteEventButton from "./delete-event-button";
import AdminToastListener from "./toast-listener";

const statusClasses: Record<Status, string> = {
  [Status.ACCEPTED]:
    "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20",
  [Status.DRAFT]:
    "bg-amber-500/10 text-amber-600 border border-amber-500/20",
  [Status.PENDING]:
    "bg-blue-500/10 text-blue-600 border border-blue-500/20",
  [Status.CANCELLED]:
    "bg-rose-500/10 text-rose-600 border border-rose-500/20",
  [Status.REJECTED]:
    "bg-slate-500/10 text-slate-600 border border-slate-500/20",
};

const metrics = [
  {
    label: "Eventos activos",
    value: "18",
    description: "+3 esta semana",
  },
  {
    label: "Entradas vendidas",
    value: "12.450",
    description: "+8.2% vs semana anterior",
  },
  {
    label: "Ingresos estimados",
    value: "$ 38.200.000",
    description: "AR$ acumulado",
  },
  {
    label: "Capacidad promedio",
    value: "72%",
    description: "Últimos 30 días",
  },
];

type EventWithTickets = Prisma.EventGetPayload<{
  select: {
    id: true;
    name: true;
    image: true;
    status: true;
    startsAt: true;
    endsAt: true;
    tickets: {
      select: {
        quantity: true;
        _count: { select: { userTicket: true } };
      };
    };
  };
}>;

export default async function AdminDashboard() {
  const events = await db.event.findMany({
    orderBy: { startsAt: "desc" },
    take: 5,
    select: {
      id: true,
      name: true,
      image: true,
      status: true,
      startsAt: true,
      endsAt: true,
      tickets: {
        select: {
          quantity: true,
          _count: {
            select: { userTicket: true },
          },
        },
      },
    },
  });

  const hasEvents = events.length > 0;

  return (
    <div className="flex flex-col gap-8">
      <AdminToastListener />
      <section className="flex flex-col gap-4 rounded-2xl border bg-card/60 p-6 shadow-sm">
        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium uppercase text-muted-foreground">
            Panel de dueños
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">
            Bienvenido al Dashboard de Forevent
          </h1>
          <p className="text-muted-foreground">
            Controla tu operación, eventos y capacidad en un solo lugar.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/admin/events/new">Crear nuevo evento</Link>
          </Button>
          <Button variant="outline">Ver reportes</Button>
          <Button variant="secondary">Configurar pagos</Button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className="rounded-xl border bg-card p-5 shadow-sm"
          >
            <p className="text-sm text-muted-foreground">{metric.label}</p>
            <p className="mt-2 text-2xl font-semibold">{metric.value}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {metric.description}
            </p>
          </div>
        ))}
      </section>

      <section id="eventos" className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-semibold">Eventos</h2>
            <p className="text-sm text-muted-foreground">
              Gestiona y monitorea la capacidad en tiempo real.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline">Crear nuevo</Button>
            <Button variant="secondary">Importar lista</Button>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <div className="grid gap-3 md:grid-cols-[1.2fr_1fr_auto] md:items-end">
            <div className="grid gap-2">
              <Label htmlFor="search">Buscar evento</Label>
              <Input id="search" placeholder="Nombre, fecha o estado" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="filter">Filtrar por estado</Label>
              <Input id="filter" placeholder="Activo, preventa, pausado" />
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline">Aplicar filtros</Button>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {!hasEvents && (
            <div className="rounded-xl border border-dashed bg-card p-8 text-center text-sm text-muted-foreground">
              No hay eventos recientes. Crea el primero para empezar a gestionar
              la capacidad.
            </div>
          )}
          {events.map((event: EventWithTickets) => {
            const isActive = event.status === Status.ACCEPTED;
            const toggleLabel = isActive ? "Pausar" : "Publicar";
            const capacity = event.tickets.reduce(
              (total, ticket) => total + ticket.quantity,
              0,
            );
            const sold = event.tickets.reduce(
              (total, ticket) => total + ticket._count.userTicket,
              0,
            );
            const capacityPercent =
              capacity > 0 ? Math.round((sold / capacity) * 100) : 0;
            const dateLabel = new Intl.DateTimeFormat("es-AR", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            }).format(event.startsAt);
            return (
              <div
                key={event.id}
                className="flex flex-col gap-4 rounded-xl border bg-card p-5 shadow-sm md:flex-row md:items-center md:justify-between"
              >
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="h-10 w-10 overflow-hidden rounded-full bg-muted">
                      {event.image ? (
                        <img
                          src={event.image}
                          alt={event.name}
                          className="h-10 w-10 object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-muted-foreground">
                          {event.name.slice(0, 1).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <h3 className="text-lg font-semibold">{event.name}</h3>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${statusClasses[event.status] ?? "bg-secondary text-secondary-foreground"}`}
                    >
                      {event.status}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {dateLabel}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Capacidad</span>
                      <span>
                        {sold}/{capacity} ({capacityPercent}%)
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${capacityPercent}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" asChild>
                    <Link href={`/admin/events/${event.id}/edit`}>Editar</Link>
                  </Button>
                  <form
                    action={toggleEventStatus.bind(
                      null,
                      event.id,
                      event.status as Status,
                    )}
                  >
                    <Button
                      size="sm"
                      variant={isActive ? "secondary" : "primary"}
                      type="submit"
                      className="gap-2"
                    >
                      {isActive ? (
                        <PauseCircle className="h-4 w-4" />
                      ) : (
                        <PlayCircle className="h-4 w-4" />
                      )}
                      {toggleLabel}
                    </Button>
                  </form>
                  <Button size="sm" asChild>
                    <Link href={`/admin/events/${event.id}`}>Ver detalle</Link>
                  </Button>
                  <DeleteEventButton
                    label="Borrar"
                    action={deleteEventAction.bind(null, event.id)}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}