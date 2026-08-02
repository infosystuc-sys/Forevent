"use client"

import type { RouterOutputs } from "@forevent/api"
import type { Session } from '@forevent/auth'
import {
  Banknote,
  CalendarCheck,
  CalendarClock,
  CalendarRange,
  Ticket,
  Users,
} from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { api } from "~/trpc/react"
import { Badge } from '../../ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card'
import SummaryCard from '../summary-card'

type Summary = Awaited<RouterOutputs["web"]["guild"]["getGuildSummary"]>

const currency = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 0,
})
const number = new Intl.NumberFormat('es-AR')

const statusStyles: Record<string, string> = {
  ACCEPTED: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  PENDING: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  DRAFT: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  REJECTED: 'bg-slate-500/10 text-slate-500 border-slate-500/20',
  CANCELLED: 'bg-rose-500/10 text-rose-600 border-rose-500/20',
}
const statusLabels: Record<string, string> = {
  ACCEPTED: 'Publicado',
  PENDING: 'Pendiente',
  DRAFT: 'Borrador',
  REJECTED: 'Rechazado',
  CANCELLED: 'Cancelado',
}

export default function GuildSummary({ summary, session }: {
  summary: Summary,
  session: Session | null
}) {
  const params = useParams()
  const guildId = params?.guildId as string

  const getSummary = api.web.guild.getGuildSummary.useQuery(
    { guildId, period: "LASTWEEK" },
    { initialData: summary },
  )
  const d = getSummary.data

  const occupancy = d.capacity > 0 ? Math.round((d.ticketsSold / d.capacity) * 100) : 0

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Inicio</h1>
        <p className="text-sm text-muted-foreground">
          Resumen de tu organización
        </p>
      </header>

      {/* Métricas de negocio */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard item={{
          value: currency.format(d.revenue),
          icon: <Banknote className="h-4 w-4 text-muted-foreground" />,
          title: 'Ingresos confirmados',
          href: `/v1/${guildId}/sales`,
        }} />
        <SummaryCard item={{
          value: number.format(d.ticketsSold),
          icon: <Ticket className="h-4 w-4 text-muted-foreground" />,
          title: 'Entradas vendidas',
        }} />
        <SummaryCard item={{
          value: `${occupancy}%`,
          icon: <CalendarCheck className="h-4 w-4 text-muted-foreground" />,
          title: 'Ocupación',
        }} />
        <SummaryCard item={{
          value: number.format(d.activeEvents),
          icon: <CalendarClock className="h-4 w-4 text-muted-foreground" />,
          title: 'Eventos activos',
          href: `/v1/${guildId}/events?q=ACCEPTED`,
        }} />
      </section>

      {/* Próximos eventos */}
      <section>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Próximos eventos</CardTitle>
            <Link
              href={`/v1/${guildId}/events`}
              className="text-sm font-medium text-primary hover:underline"
            >
              Ver todos
            </Link>
          </CardHeader>
          <CardContent>
            {d.upcomingEvents.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No hay eventos programados.{' '}
                <Link
                  href={`/v1/${guildId}/events/create`}
                  className="font-medium text-primary hover:underline"
                >
                  Creá el primero
                </Link>
              </p>
            ) : (
              <ul className="divide-y">
                {d.upcomingEvents.map((ev) => {
                  const pct = ev.capacity > 0
                    ? Math.min(100, Math.round((ev.sold / ev.capacity) * 100))
                    : 0
                  return (
                    <li key={ev.id}>
                      <Link
                        href={`/v1/${guildId}/events/${ev.id}`}
                        className="flex items-center gap-4 py-3 transition-colors hover:bg-accent/50"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="truncate text-sm font-medium">
                              {ev.name}
                            </span>
                            <Badge
                              variant="outline"
                              className={statusStyles[ev.status] ?? ''}
                            >
                              {statusLabels[ev.status] ?? ev.status}
                            </Badge>
                          </div>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {new Date(ev.startsAt).toLocaleDateString('es-AR', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                        <div className="hidden w-40 shrink-0 sm:block">
                          <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                            <span className="tabular-nums">
                              {number.format(ev.sold)}/{number.format(ev.capacity)}
                            </span>
                            <span className="tabular-nums">{pct}%</span>
                          </div>
                          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full rounded-full bg-primary"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Estado de los eventos */}
      <section>
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">
          Estado de los eventos
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard item={{
            value: d.pendingEvents.toString(),
            icon: <CalendarClock className="h-4 w-4 text-muted-foreground" />,
            title: 'Pendientes',
            href: `/v1/${guildId}/events?q=PENDING`,
          }} />
          <SummaryCard item={{
            value: d.approvedEvents.toString(),
            icon: <CalendarCheck className="h-4 w-4 text-muted-foreground" />,
            title: 'Aprobados',
            href: `/v1/${guildId}/events?q=ACCEPTED`,
          }} />
          <SummaryCard item={{
            value: d.pastEvents.toString(),
            icon: <CalendarRange className="h-4 w-4 text-muted-foreground" />,
            title: 'Pasados',
            href: `/v1/${guildId}/events?q=PAST`,
          }} />
          <SummaryCard item={{
            value: d.employeeCount.toString(),
            icon: <Users className="h-4 w-4 text-muted-foreground" />,
            title: 'Empleados',
            href: `/v1/${guildId}/employees`,
          }} />
        </div>
      </section>
    </div>
  )
}
