import Image from "next/image";
import EventStatusSelect from "~/app/_components/admin/event/event-status-select";
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
          {eventSummary.event && (
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold text-muted-foreground">Estado:</span>
              <EventStatusSelect
                eventId={params.eventId}
                currentStatus={eventSummary.event.status as "ACCEPTED" | "PENDING" | "CANCELLED" | "REJECTED" | "DRAFT"}
              />
            </div>
          )}
          <h5 className="font-light text-primary">{customdayjs(eventSummary.event?.startsAt).locale("es").format('LLLL')} - {customdayjs(eventSummary.event?.endsAt).format('LLLL')}</h5>
          <p className="text-muted-foreground mt-5">{eventSummary.event?.about}</p>
        </div>
      </div>
      <Separator className="my-10" />
      <EventSummary summary={eventSummary} />
    </div>
  )
}
