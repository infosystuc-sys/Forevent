"use client";

import { api } from "~/trpc/react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/app/_components/ui/select";

const STATUS_OPTIONS: { value: "ACCEPTED" | "PENDING" | "CANCELLED" | "REJECTED" | "DRAFT"; label: string }[] = [
  { value: "PENDING", label: "Pendiente" },
  { value: "ACCEPTED", label: "Aceptado" },
  { value: "REJECTED", label: "Rechazado" },
  { value: "CANCELLED", label: "Cancelado" },
  { value: "DRAFT", label: "Borrador" },
];

type EventStatus = (typeof STATUS_OPTIONS)[number]["value"];

interface EventStatusSelectProps {
  eventId: string;
  currentStatus: EventStatus;
  className?: string;
}

export default function EventStatusSelect({ eventId, currentStatus, className }: EventStatusSelectProps) {
  const utils = api.useUtils();

  const updateStatus = api.web.event.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Estado del evento actualizado");
      void utils.web.event.eventSummary.invalidate({ eventId });
      void utils.web.event.byGuildId.invalidate();
    },
    onError: (err) => {
      toast.error(err.message ?? "Error al cambiar el estado");
    },
  });

  const handleChange = (value: string) => {
    updateStatus.mutate({ eventId, status: value as EventStatus });
  };

  const label = STATUS_OPTIONS.find((o) => o.value === currentStatus)?.label ?? currentStatus;

  return (
    <Select
      value={currentStatus}
      onValueChange={handleChange}
      disabled={updateStatus.isPending}
    >
      <SelectTrigger className={className ?? "w-[180px]"} aria-label="Cambiar estado del evento">
        <SelectValue placeholder="Estado">{label}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        {STATUS_OPTIONS.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
