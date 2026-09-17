"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Ban, PauseCircle, PlayCircle, Send, Undo2 } from "lucide-react";

import type { Status } from "@forevent/db";
import { api } from "~/trpc/react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "~/app/_components/ui/alert-dialog";
import { Button } from "~/app/_components/ui/button";

/**
 * Acciones de estado disponibles para el Dueño/Manager (PDF §8/§9).
 * El Dueño nunca publica: sólo envía a aprobación. Publicar/rechazar es del Super Usuario
 * y la API lo valida en `event.updateStatus` con la misma máquina de estados.
 */
const STATUS_META: Record<Status, { label: string; className: string; hint?: string }> = {
  DRAFT: { label: "Borrador", className: "bg-neutral-500/10 text-neutral-300 border-neutral-500/30", hint: "El evento todavía no fue enviado a Forevent." },
  PENDING: { label: "Pendiente de aprobación", className: "bg-blue-500/10 text-blue-400 border-blue-500/30", hint: "El equipo de Forevent está revisando el evento." },
  ACCEPTED: { label: "Publicado", className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30", hint: "Visible en la app para los usuarios." },
  PAUSED: { label: "Pausado", className: "bg-orange-500/10 text-orange-400 border-orange-500/30", hint: "Oculto en la app hasta que lo reanudes." },
  REJECTED: { label: "Rechazado", className: "bg-red-500/10 text-red-400 border-red-500/30", hint: "Revisá los comentarios, corregí y volvé a enviarlo." },
  CANCELLED: { label: "Dado de baja", className: "bg-red-500/10 text-red-300 border-red-500/30" },
};

interface Action {
  to: Status;
  label: string;
  icon: React.ReactNode;
  variant?: "default" | "secondary" | "outline" | "destructive";
  confirm?: { title: string; description: string };
}

const ACTIONS: Record<Status, Action[]> = {
  DRAFT: [
    { to: "PENDING", label: "Enviar a aprobación", icon: <Send className="h-4 w-4" /> },
  ],
  REJECTED: [
    { to: "PENDING", label: "Volver a enviar a aprobación", icon: <Send className="h-4 w-4" /> },
  ],
  PENDING: [
    { to: "DRAFT", label: "Volver a borrador", icon: <Undo2 className="h-4 w-4" />, variant: "outline" },
  ],
  ACCEPTED: [
    {
      to: "PAUSED", label: "Pausar", icon: <PauseCircle className="h-4 w-4" />, variant: "secondary",
      confirm: { title: "¿Pausar el evento?", description: "Dejará de verse en la app hasta que lo reanudes. Las entradas ya vendidas siguen siendo válidas." },
    },
  ],
  PAUSED: [
    { to: "ACCEPTED", label: "Reanudar", icon: <PlayCircle className="h-4 w-4" /> },
  ],
  CANCELLED: [],
};

const CANCEL_ACTION: Action = {
  to: "CANCELLED", label: "Dar de baja", icon: <Ban className="h-4 w-4" />, variant: "destructive",
  confirm: { title: "¿Dar de baja el evento?", description: "Esta acción no se puede deshacer desde el panel. El evento dejará de estar disponible en la app." },
};

export default function EventStatusActions({ eventId, currentStatus }: { eventId: string; currentStatus: Status }) {
  const utils = api.useUtils();
  const router = useRouter();

  const updateStatus = api.web.event.updateStatus.useMutation({
    onSuccess: (_res, vars) => {
      toast.success(`Evento: ${STATUS_META[vars.status].label.toLowerCase()}`);
      void utils.web.event.eventSummary.invalidate({ eventId });
      void utils.web.event.byGuildId.invalidate();
      router.refresh();
    },
    onError: (err) => toast.error(err.message ?? "Error al cambiar el estado"),
  });

  const meta = STATUS_META[currentStatus];
  const actions = [...ACTIONS[currentStatus], ...(currentStatus === "CANCELLED" ? [] : [CANCEL_ACTION])];

  const run = (to: Status) => updateStatus.mutate({ eventId, status: to });

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className={`rounded-full border px-3 py-1 text-xs font-medium ${meta.className}`}>{meta.label}</span>
        {meta.hint && <span className="text-xs text-muted-foreground">{meta.hint}</span>}
      </div>
      <div className="flex flex-wrap gap-2">
        {actions.map((action) =>
          action.confirm ? (
            <AlertDialog key={action.to}>
              <AlertDialogTrigger asChild>
                <Button size="sm" variant={action.variant ?? "default"} disabled={updateStatus.isPending} className="gap-2">
                  {action.icon}{action.label}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{action.confirm.title}</AlertDialogTitle>
                  <AlertDialogDescription>{action.confirm.description}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={() => run(action.to)}>{action.label}</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : (
            <Button key={action.to} size="sm" variant={action.variant ?? "default"} disabled={updateStatus.isPending} className="gap-2" onClick={() => run(action.to)}>
              {action.icon}{action.label}
            </Button>
          ),
        )}
      </div>
    </div>
  );
}
