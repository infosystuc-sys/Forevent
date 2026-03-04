'use client'
import type { RouterOutputs } from "@forevent/api"
import { CircleDollarSign, DoorOpen, SquareUserRound, Store, Ticket, Users2 } from "lucide-react"
import Image from "next/image"
import { useParams } from "next/navigation"
import { api } from "~/trpc/react"
import { Alert, AlertDescription, AlertTitle } from "../../ui/alert"
import SummaryCard from "../summary-card"

const EventSummary = ({ summary }: { summary: Awaited<RouterOutputs["web"]["event"]["eventSummary"]> }) => {
  const params = useParams()

  const getSummary = api.web.event.eventSummary.useQuery({ eventId: params?.eventId! as string }, { initialData: summary })

  return (
    <div>
      <div>
        <h3 className="text-2xl tracking-wider font-bold">Resumen</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 my-6">
          <SummaryCard item={{ value: `$${getSummary.data.salesTotal._sum.total ? getSummary.data.salesTotal._sum.total.toString() : '0'}`, icon: <CircleDollarSign />, title: 'Ventas', href: `/v1/${params.guildId}/events/${params.eventId}/purchases` }} />
          <SummaryCard item={{ value: getSummary.data.countersCount.toString(), icon: <Store />, title: 'Barras', href: `/v1/${params.guildId}/events/${params.eventId}/stores` }} />
          <SummaryCard item={{ value: getSummary.data.gatesCount.toString(), icon: <DoorOpen />, title: 'Puertas', href: `/v1/${params.guildId}/events/${params.eventId}/gates` }} />
          <SummaryCard item={{ value: getSummary.data.usersCount.toString(), icon: <Users2 />, title: 'Personas en este evento', href: `/v1/${params.guildId}/events/${params.eventId}/users` }} />
          <SummaryCard item={{ value: getSummary.data.employeesCount.toString(), icon: <SquareUserRound />, title: 'Empleados en este evento', href: `/v1/${params.guildId}/events/${params.eventId}/employees` }} />
        </div>
      </div>
      <div>
        <h3 className="text-2xl tracking-wider font-bold">Artistas</h3>
        <div className="flex">
          {
            getSummary.data.artists.length > 0
              ?
              getSummary.data.artists.map((artist, index) => {
                return (
                  <div className="flex gap-5 flex-col m-7 justify-center items-center" key={`artist-${index + 1}`}>
                    <Image src={artist.image} alt={artist.name} width={150} height={150} className="rounded-full w-[150px] h-[150px] object-cover bg-center" />
                    <h5 className="text-2xl font-semibold tracking-wide">{artist.name}</h5>
                  </div>
                )
              })
              :
              <p className="text-muted-foreground text-lg tracking-wide my-5">No hay artistas registrados en este evento</p>
          }
        </div>
      </div>
      <div>
        <div className="flex gap-2 items-center">
          <h3 className="text-2xl tracking-wider font-bold">Tickets</h3>
          {/* <div className={`${getSummary.data.event ? getSummary.data.event.tickets.length < 1 && 'hidden' : ''}`}>
            <Link className={buttonVariants({ variant: "outline", size: "sm" })} href={`/v1/${params.guildId}/events/${params.eventId}/tickets`}>
              Ver detalles
            </Link>
          </div> */}
        </div>
        <div className="grid gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 my-5">
          {
            getSummary.data.event?.tickets && getSummary.data.event?.tickets?.length > 0
              ? getSummary.data.event?.tickets.map((ticket, index) => {
                return (
                  <Alert>
                    <Ticket className="h-4 w-4" />
                    <AlertTitle>{ticket.name}</AlertTitle>
                    <AlertDescription>
                      <p>${ticket.price}</p>
                      <p className="text-muted-foreground">{ticket.quantity} tickets restante(s)</p>
                    </AlertDescription>
                  </Alert>
                )
              })
              : <p className="text-muted-foreground text-lg tracking-wide my-5">Este evento aún no tiene tickets</p>
          }
        </div>
      </div>
    </div>
  )
}

export default EventSummary