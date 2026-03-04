import Image from "next/image";
import EventSummary from "~/app/_components/admin/event/event-summary";
import Return from "~/app/_components/return";
import { Separator } from "~/app/_components/ui/separator";
import { customdayjs } from "~/lib/constants";
import { api } from "~/trpc/server";

export default async function DashboardPage({ params }: { params: { guildId: string, eventId: string } }) {
  const eventSummary = await api.web.event.eventSummary({ eventId: params.eventId })

  return (
    <div className="container">
      <Return text="Volver al inicio" href={`/v1/${params.guildId}`} />
      <div className="flex items-center gap-9">
        <div className="h-64 w-64">
          <Image src={eventSummary.event?.image!} alt={eventSummary.event?.name!} width={200} height={200} className="rounded-full w-full h-full object-cover" />
        </div>
        <div>
          <h1 className="text-3xl font-bold my-3 tracking-wider">{eventSummary.event?.name}</h1>
          <h3 className="text-lg font-semibold">{eventSummary.event?.status === "ACCEPTED" ? "Aceptado" : eventSummary.event?.status === "PENDING" ? "Pendiente" : eventSummary.event?.status === "CANCELLED" ? "Cancelado" : "Rechazado"}</h3>
          <h5 className="font-light text-primary">{customdayjs(eventSummary.event?.startsAt).locale("es").format('LLLL')} - {customdayjs(eventSummary.event?.endsAt).format('LLLL')}</h5>
          <p className="text-muted-foreground mt-5">{eventSummary.event?.about}</p>
        </div>
      </div>
      <Separator className="my-10" />
      <EventSummary summary={eventSummary} />
    </div>
  )
}
