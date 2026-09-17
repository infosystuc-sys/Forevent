import ReviewEvent from '~/app/_components/internal/event'
import { api } from '~/trpc/server'
import { requireStaff } from '~/lib/staff'

export default async function Page({ params }: { params: { eventId: string, guildId:string } }) {
  // Next renderiza layout y page en paralelo: el guard del layout no evita que el page
  // consulte datos antes del redirect, así que cada página vuelve a exigir Super Usuario.
  await requireStaff()
  const data = await api.web.event.byId({ id: params.eventId })
  return (
    <ReviewEvent data={data} guildId={params.guildId}  eventId={params.eventId} />
  )
}