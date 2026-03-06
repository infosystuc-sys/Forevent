"use client";

import { useLoadScript } from "@react-google-maps/api";
import { useCallback, useEffect, useRef, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";

import { Button } from "@forevent/ui/button";
import { Input } from "@forevent/ui/input";
import { Label } from "@forevent/ui/label";

import type { createEventAction } from "../actions";

const GEOCODE_DEBOUNCE_MS = 800;
const GEOCODE_SAFETY_TIMEOUT_MS = 5000;

type OrganizationOption = {
  id: string;
  name: string;
};

function SubmitButton({
  label,
  isGeocoding,
  coordsLat,
  onCancelGeocode,
}: {
  label: string;
  isGeocoding?: boolean;
  coordsLat?: string;
  onCancelGeocode?: () => void;
}) {
  const { pending } = useFormStatus();
  const isButtonDisabled = isGeocoding || pending;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button type="submit" disabled={isButtonDisabled}>
        {pending ? "Guardando..." : label}
      </Button>
      {isGeocoding && onCancelGeocode ? (
        <button
          type="button"
          onClick={onCancelGeocode}
          className="text-xs text-amber-600 hover:text-amber-700 underline"
        >
          (Cancelar búsqueda)
        </button>
      ) : (
        <span className="text-xs text-muted-foreground">
          {isGeocoding ? "Buscando..." : "Listo"} | {pending ? "Enviando..." : ""}{" "}
          | Lat: {coordsLat ?? "-"}
        </span>
      )}
    </div>
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
  latitude?: number | null;
  longitude?: number | null;
  locationAddress?: string | null;
  locationCity?: string | null;
  locationState?: string | null;
  locationCountry?: string | null;
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
  const geocodeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const geocodeRunIdRef = useRef(0);

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: apiKey,
  });

  // 4 campos editables de ubicación
  const [address, setAddress] = useState(
    initialData?.locationAddress ?? initialData?.location ?? "",
  );
  const [locationCity, setLocationCity] = useState(
    initialData?.locationCity ?? "",
  );
  const [locationState, setLocationState] = useState(
    initialData?.locationState ?? "",
  );
  const [locationCountry, setLocationCountry] = useState(
    initialData?.locationCountry ?? "Argentina",
  );

  // Coordenadas calculadas por Geocoder (solo lectura)
  const [coords, setCoords] = useState({
    lat: initialData?.latitude != null ? String(initialData.latitude) : "",
    lng: initialData?.longitude != null ? String(initialData.longitude) : "",
  });
  const [geocodeError, setGeocodeError] = useState<string | null>(null);
  const [isGeocoding, setIsGeocoding] = useState(false);

  const hasValidCoords = Boolean(coords.lat && coords.lng);
  const googleMapsUrl =
    coords.lat && coords.lng
      ? `https://www.google.com/maps?q=${coords.lat},${coords.lng}`
      : null;

  // Dirección combinada para Location.name (limpia)
  const fullAddress = `${address}, ${locationCity}, ${locationState}, ${locationCountry}`
    .replace(/,\s*,/g, ",")
    .replace(/^\s*,\s*|\s*,\s*$/g, "")
    .trim() || "";

  const runGeocode = useCallback(() => {
    setIsGeocoding(true);
    if (!fullAddress.trim()) {
      setCoords({ lat: "", lng: "" });
      setGeocodeError(null);
      setIsGeocoding(false);
      return;
    }
    if (address.trim().length < 3) {
      setIsGeocoding(false);
      return;
    }
    if (typeof window === "undefined" || !window.google?.maps?.Geocoder) {
      console.error("[Geocoder] window.google no disponible");
      setGeocodeError("Cargando mapas...");
      setIsGeocoding(false);
      return;
    }
    setGeocodeError(null);
    const geocodeAddress =
      `${address}, ${locationCity}, ${locationState}, ${locationCountry}`.replace(
        /,\s*,/g,
        ",",
      );
    console.log("Enviando a Google:", geocodeAddress);
    geocodeRunIdRef.current += 1;
    const currentRunId = geocodeRunIdRef.current;
    let safetyTimeoutId: ReturnType<typeof setTimeout> | null = null;
    const forceDone = () => {
      if (currentRunId !== geocodeRunIdRef.current) return;
      setIsGeocoding(false);
    };
    safetyTimeoutId = setTimeout(forceDone, GEOCODE_SAFETY_TIMEOUT_MS);
    try {
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode(
        { address: geocodeAddress },
        (results, status) => {
          clearTimeout(safetyTimeoutId!);
          if (currentRunId !== geocodeRunIdRef.current) return;
          setIsGeocoding(false);
          if (status === "OK" && results?.[0]?.geometry?.location) {
            const loc = results[0].geometry.location;
            const latNum = Number(typeof loc.lat === "function" ? loc.lat() : loc.lat);
            const lngNum = Number(typeof loc.lng === "function" ? loc.lng() : loc.lng);
            setCoords({
              lat: String(latNum),
              lng: String(lngNum),
            });
            setGeocodeError(null);
          } else {
            setCoords({ lat: "", lng: "" });
            setGeocodeError(
              geocodeAddress.trim()
                ? "Dirección no encontrada en el mapa"
                : null,
            );
          }
        },
      );
    } catch (err) {
      clearTimeout(safetyTimeoutId);
      console.error("[Geocoder] Error:", err);
      setIsGeocoding(false);
      setGeocodeError("Error al buscar la ubicación");
      setCoords({ lat: "", lng: "" });
    }
  }, [fullAddress, address, locationCity, locationState, locationCountry]);

  useEffect(() => {
    setIsGeocoding(true);
    if (geocodeTimerRef.current) {
      clearTimeout(geocodeTimerRef.current);
    }
    geocodeTimerRef.current = setTimeout(() => {
      runGeocode();
    }, GEOCODE_DEBOUNCE_MS);
    return () => {
      if (geocodeTimerRef.current) {
        clearTimeout(geocodeTimerRef.current);
      }
    };
  }, [
    isLoaded,
    address,
    locationCity,
    locationState,
    locationCountry,
    runGeocode,
  ]);

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
      {/* Campos de ubicación para el Server Action */}
      <input type="hidden" name="location" value={fullAddress} />
      <input type="hidden" name="address" value={address} />
      <input type="hidden" name="locationCity" value={locationCity} />
      <input type="hidden" name="locationState" value={locationState} />
      <input type="hidden" name="locationCountry" value={locationCountry} />
      <input type="hidden" name="latitude" value={coords.lat} />
      <input type="hidden" name="longitude" value={coords.lng} />
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

      {/* ── Ubicación (4 campos editables + coordenadas automáticas) ─────── */}
      <div className="rounded-lg border border-dashed border-muted-foreground/40 bg-muted/20 p-4 space-y-4">
        <p className="text-sm font-semibold text-foreground flex items-center gap-2">
          <span>📍</span> Ubicación
          <span className="text-xs font-normal text-muted-foreground">
            — las coordenadas se calculan automáticamente
          </span>
        </p>

        {/* Calle y Número */}
        <div className="grid gap-2">
          <Label htmlFor="address">Calle y Número</Label>
          <Input
            id="address"
            placeholder="Av. Aconquija 3411"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            required
          />
        </div>

        {/* Localidad, Provincia, País */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="locationCity">Localidad</Label>
            <Input
              id="locationCity"
              placeholder="Yerba Buena"
              value={locationCity}
              onChange={(e) => setLocationCity(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="locationState">Provincia</Label>
            <Input
              id="locationState"
              placeholder="Tucumán"
              value={locationState}
              onChange={(e) => setLocationState(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="locationCountry">País</Label>
            <Input
              id="locationCountry"
              placeholder="Argentina"
              value={locationCountry}
              onChange={(e) => setLocationCountry(e.target.value)}
            />
          </div>
        </div>

        {/* Latitud y Longitud — solo lectura, calculadas por Geocoder */}
        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="latitude">Latitud</Label>
            <Input
              id="latitude"
              type="text"
              inputMode="decimal"
              placeholder={isGeocoding ? "Buscando..." : "-26.8167"}
              value={coords.lat}
              readOnly
              className="cursor-not-allowed bg-muted/60 opacity-90"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="longitude">Longitud</Label>
            <Input
              id="longitude"
              type="text"
              inputMode="decimal"
              placeholder={isGeocoding ? "Buscando..." : "-65.2833"}
              value={coords.lng}
              readOnly
              className="cursor-not-allowed bg-muted/60 opacity-90"
            />
          </div>
        </div>

        {geocodeError && (
          <p className="text-sm text-amber-600 dark:text-amber-500">
            {geocodeError}
          </p>
        )}

        {googleMapsUrl && (
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-md border border-blue-500/40 bg-blue-500/10 px-3 py-1.5 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-500/20 dark:text-blue-400"
          >
            <span>🗺️</span> Ver punto en Google Maps
          </a>
        )}
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

      {!hasValidCoords && (
        <p className="text-sm text-muted-foreground">
          Las coordenadas se calculan automáticamente al completar la dirección.
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <SubmitButton
          label={initialData ? "Guardar cambios" : "Guardar evento"}
          isGeocoding={isGeocoding}
          coordsLat={coords.lat}
          onCancelGeocode={() => setIsGeocoding(false)}
        />
      </div>
    </form>
  );
}
