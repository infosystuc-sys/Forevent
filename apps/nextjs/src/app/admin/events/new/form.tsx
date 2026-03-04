"use client";

import { useEffect, useRef, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";

import { Button } from "@forevent/ui/button";
import { Input } from "@forevent/ui/input";
import { Label } from "@forevent/ui/label";

import type { createEventAction } from "../actions";

type OrganizationOption = {
  id: string;
  name: string;
};

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Guardando..." : label}
    </Button>
  );
}

const initialState = { error: null as string | null };

export type EventFormData = {
  id: string;
  name: string;
  organizationId: string;
  description: string;
  startsAt: string;
  location: string;
  imageUrl: string;
  capacity: number;
};

export default function CreateEventForm({
  organizations,
  action,
  initialData,
}: {
  organizations: OrganizationOption[];
  action: typeof createEventAction;
  initialData?: EventFormData;
}) {
  const [state, formAction] = useFormState(action, initialState);
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    initialData?.imageUrl ?? null,
  );
  const [previewIsObjectUrl, setPreviewIsObjectUrl] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl && previewIsObjectUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl, previewIsObjectUrl]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    if (previewUrl && previewIsObjectUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(URL.createObjectURL(file));
    setPreviewIsObjectUrl(true);
  };

  const clearSelectedImage = () => {
    if (previewUrl && previewIsObjectUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setPreviewIsObjectUrl(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <form
      action={formAction}
      encType="multipart/form-data"
      className="grid gap-6"
    >
      {initialData?.id && (
        <input type="hidden" name="eventId" value={initialData.id} />
      )}
      {initialData?.imageUrl && (
        <input
          type="hidden"
          name="existingImageUrl"
          value={initialData.imageUrl}
        />
      )}
      <div className="grid gap-2">
        <Label htmlFor="name">Nombre del evento</Label>
        <Input
          id="name"
          name="name"
          placeholder="Nombre del evento"
          defaultValue={initialData?.name}
          required
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="organizationId">Organización</Label>
        <select
          id="organizationId"
          name="organizationId"
          required
          defaultValue={initialData?.organizationId ?? ""}
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <option value="">Selecciona una organización</option>
          {organizations.map((org) => (
            <option key={org.id} value={org.id}>
              {org.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="description">Descripción</Label>
        <textarea
          id="description"
          name="description"
          rows={4}
          required
          defaultValue={initialData?.description}
          className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          placeholder="Describe el evento"
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="startsAt">Fecha y hora de inicio</Label>
        <Input
          id="startsAt"
          name="startsAt"
          type="datetime-local"
          defaultValue={initialData?.startsAt}
          required
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="location">Dirección / Ubicación</Label>
        <Input
          id="location"
          name="location"
          placeholder="Dirección del evento"
          defaultValue={initialData?.location}
          required
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="coverImage">Imagen de portada</Label>
        <Input
          id="coverImage"
          name="coverImage"
          type="file"
          accept="image/*"
          required={!initialData}
          ref={fileInputRef}
          onChange={handleFileChange}
        />
        {previewUrl && (
          <div className="flex items-start gap-4 rounded-md border bg-muted/30 p-3">
            <img
              src={previewUrl}
              alt="Vista previa"
              className="h-20 w-20 rounded-md object-cover"
            />
            <div className="flex flex-1 items-center justify-between gap-2">
              <p className="text-xs text-muted-foreground">
                Vista previa de la imagen seleccionada
              </p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={clearSelectedImage}
              >
                Quitar
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="capacity">Capacidad total</Label>
        <Input
          id="capacity"
          name="capacity"
          type="number"
          min={1}
          required
          defaultValue={initialData?.capacity}
        />
      </div>

      {state.error && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {state.error}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <SubmitButton
          label={initialData ? "Guardar cambios" : "Guardar evento"}
        />
      </div>
    </form>
  );
}
