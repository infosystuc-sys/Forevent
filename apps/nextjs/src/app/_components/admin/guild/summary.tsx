"use client"

import type { RouterOutputs } from "@forevent/api"
import type { Session } from '@forevent/auth'
import { zodResolver } from '@hookform/resolvers/zod'
import { CalendarCheck, CalendarClock, CalendarOff, CalendarRange, Users } from 'lucide-react'
import { useParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { api } from "~/trpc/react"
import SummaryCard from '../summary-card'

const periodSchema = z.object({
  period: z.enum(['LASTWEEK', 'LASTMONTH', 'THREEMONTHS', 'SIXMONTHS', 'LASTYEAR', 'ALLTIME'])
})

export default function GuildSummary({ summary, session }: {
  summary: Awaited<RouterOutputs["web"]["guild"]["getGuildSummary"]>,
  session: Session | null
}) {
  const params = useParams()

  const form = useForm({
    resolver: zodResolver(periodSchema),
    defaultValues: {
      period: undefined
    },
  })

  const getSummary = api.web.guild.getGuildSummary.useQuery({ guildId: params?.guildId! as string, period: form.watch("period") ?? "LASTWEEK" }, { initialData: summary })

  return (
    <>
      <h1 className="text-3xl"></h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <SummaryCard item={{ value: getSummary.data.employeeCount.toString(), icon: <Users />, title: 'Empleados', href: `/v1/${params.guildId}/employees` }} />
        <SummaryCard item={{ value: getSummary.data.pendingEvents!.toString(), icon: <CalendarClock />, title: 'Eventos pendientes', href: `/v1/${params.guildId}/events?q=PENDING` }} />
        <SummaryCard item={{ value: getSummary.data.pastEvents!.toString(), icon: <CalendarRange />, title: 'Eventos pasados', href: `/v1/${params.guildId}/events?q=PAST` }} />
        <SummaryCard item={{ value: getSummary.data.approvedEvents!.toString(), icon: <CalendarCheck />, title: 'Eventos aprobados', href: `/v1/${params.guildId}/events?q=ACCEPTED` }} />
        <SummaryCard item={{ value: getSummary.data.rejectedEvents!.toString(), icon: <CalendarOff />, title: 'Eventos rechazados', href: `/v1/${params.guildId}/events?q=REJECTED` }} />
      </div>
    </>
  )
}
