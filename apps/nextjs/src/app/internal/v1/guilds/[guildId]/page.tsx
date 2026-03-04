import ReviewEvent from '~/app/_components/internal/event'
import { api } from '~/trpc/server'

export default async function Page({ params }: { params: { eventId: string, guildId:string } }) {
  const data = await api.web.event.byId({ id: params.eventId })
  return (
    <ReviewEvent data={data} guildId={params.guildId}  eventId={params.eventId} />
  )
}