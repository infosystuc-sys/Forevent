"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { cn } from "~/lib/utils";

/**
 * Navegación de nivel evento. Vive dentro del contenido, no en el sidebar,
 * para que el nivel organización quede siempre visible y estable.
 */
export default function EventTabs({ eventName }: { eventName?: string }) {
  const params = useParams();
  const path = usePathname();
  const guildId = params?.guildId as string;
  const eventId = params?.eventId as string;
  const base = `/v1/${guildId}/events/${eventId}`;

  const tabs = [
    { href: base, label: "Resumen", exact: true },
    { href: `${base}/products`, label: "Productos" },
    { href: `${base}/deals`, label: "Combos" },
    { href: `${base}/deposits`, label: "Depósitos" },
    { href: `${base}/employees`, label: "Empleados" },
    { href: `${base}/sales`, label: "Ventas" },
    { href: `${base}/users`, label: "Asistentes" },
    { href: `${base}/posts`, label: "Publicaciones" },
  ];

  return (
    <div className="mb-6 flex flex-col gap-4">
      <nav aria-label="Ruta" className="flex items-center gap-1 text-sm text-muted-foreground">
        <Link href={`/v1/${guildId}/events`} className="hover:text-foreground">
          Eventos
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="truncate font-medium text-foreground">
          {eventName ?? "Evento"}
        </span>
      </nav>

      <div className="-mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
        <div className="flex w-max gap-1 border-b">
          {tabs.map((tab) => {
            const active = tab.exact ? path === tab.href : path?.startsWith(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  "whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
