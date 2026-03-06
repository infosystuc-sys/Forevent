"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import db from "@forevent/db";
import { uploadImageToS3 } from "~/lib/s3";

// Convierte un valor de FormData a número decimal o null si está vacío/inválido.
// Evita que z.coerce.number() trate el string vacío "" como 0.
const coerceCoordinate = z.preprocess((v) => {
  if (v === "" || v === null || v === undefined) return null;
  const n = Number(v);
  return isNaN(n) ? null : n;
}, z.number().nullable());

const createEventSchema = z.object({
  name: z.string().min(2, "El nombre es requerido."),
  organizationId: z.string().min(1, "La organización es requerida."),
  description: z.string().min(2, "La descripción es requerida."),
  startsAt: z.string().min(1, "La fecha de inicio es requerida."),
  location: z.string().min(2, "La ubicación es requerida."),
  address: z.string().optional(),
  capacity: z.coerce.number().int().min(1, "La capacidad debe ser mayor a 0."),
  latitude: coerceCoordinate,
  longitude: coerceCoordinate,
  locationCity: z.string().optional(),
  locationState: z.string().optional(),
  locationCountry: z.string().optional(),
});

export async function createEventAction(
  _prevState: { error: string | null },
  formData: FormData,
) {
  const parsed = createEventSchema.safeParse({
    name: formData.get("name")?.toString() ?? "",
    organizationId: formData.get("organizationId")?.toString() ?? "",
    description: formData.get("description")?.toString() ?? "",
    startsAt: formData.get("startsAt")?.toString() ?? "",
    location: formData.get("location")?.toString() ?? "",
    address: formData.get("address")?.toString() ?? "",
    capacity: formData.get("capacity")?.toString() ?? "",
    latitude: formData.get("latitude")?.toString() ?? "",
    longitude: formData.get("longitude")?.toString() ?? "",
    locationCity: formData.get("locationCity")?.toString() ?? "",
    locationState: formData.get("locationState")?.toString() ?? "",
    locationCountry: formData.get("locationCountry")?.toString() ?? "",
  });

  if (!parsed.success) {
    return {
      error: parsed.error.errors[0]?.message ?? "Datos inválidos.",
    };
  }

  const { name, organizationId, description, startsAt, location, address, capacity, latitude, longitude, locationCity, locationState, locationCountry } =
    parsed.data;

  const coverImage = formData.get("coverImage");
  if (!(coverImage instanceof File) || coverImage.size === 0) {
    return { error: "Debes subir una imagen de portada." };
  }
  if (!coverImage.type.startsWith("image/")) {
    return { error: "La imagen debe ser un archivo válido." };
  }
  if (coverImage.size > 10 * 1024 * 1024) {
    return { error: "La imagen no puede superar los 10MB." };
  }

  let imageUrl: string;
  try {
    imageUrl = await uploadImageToS3(coverImage);
  } catch (error) {
    console.error("[createEventAction] Error al subir imagen a Supabase Storage:", error);
    return { error: "No se pudo subir la imagen. Intenta de nuevo." };
  }

  const startsAtDate = new Date(startsAt);
  if (Number.isNaN(startsAtDate.getTime())) {
    throw new Error("Fecha de inicio inválida.");
  }

  const endsAtDate = new Date(startsAtDate.getTime() + 4 * 60 * 60 * 1000);

  const locAddress = address?.trim() || location;
  const locState = locationState?.trim() || "Tucumán";
  const locCountry = locationCountry?.trim() || "Argentina";
  const latNum =
    latitude != null ? Number(latitude) : null;
  const lngNum =
    longitude != null ? Number(longitude) : null;
  const createdLocation = await db.location.create({
    data: {
      name: location,
      address: locAddress,
      latitude:
        latNum != null && !Number.isNaN(latNum) ? latNum : null,
      longitude:
        lngNum != null && !Number.isNaN(lngNum) ? lngNum : null,
      iana: "America/Argentina/Buenos_Aires",
      country: locCountry,
      state: locState,
      city: locationCity?.trim() || null,
      image: imageUrl,
    },
  });

  await db.event.create({
    data: {
      name,
      about: description,
      image: imageUrl,
      startsAt: startsAtDate,
      endsAt: endsAtDate,
      locationId: createdLocation.id,
      guildId: organizationId,
      tickets: {
        create: {
          name: "General",
          price: 0,
          quantity: capacity,
          about: "Capacidad total",
        },
      },
    },
  });

  revalidatePath("/admin");
  redirect("/admin?toast=created");
}

const updateEventSchema = z.object({
  eventId: z.string().min(1, "El evento es requerido."),
  name: z.string().min(2, "El nombre es requerido."),
  organizationId: z.string().min(1, "La organización es requerida."),
  description: z.string().min(2, "La descripción es requerida."),
  startsAt: z.string().min(1, "La fecha de inicio es requerida."),
  location: z.string().min(2, "La ubicación es requerida."),
  address: z.string().optional(),
  capacity: z.coerce.number().int().min(1, "La capacidad debe ser mayor a 0."),
  existingImageUrl: z.string().min(1, "La imagen actual es requerida."),
  latitude: coerceCoordinate,
  longitude: coerceCoordinate,
  locationCity: z.string().optional(),
  locationState: z.string().optional(),
  locationCountry: z.string().optional(),
});

export async function updateEventAction(
  _prevState: { error: string | null },
  formData: FormData,
) {
  const parsed = updateEventSchema.safeParse({
    eventId: formData.get("eventId")?.toString() ?? "",
    name: formData.get("name")?.toString() ?? "",
    organizationId: formData.get("organizationId")?.toString() ?? "",
    description: formData.get("description")?.toString() ?? "",
    startsAt: formData.get("startsAt")?.toString() ?? "",
    location: formData.get("location")?.toString() ?? "",
    address: formData.get("address")?.toString() ?? "",
    capacity: formData.get("capacity")?.toString() ?? "",
    existingImageUrl: formData.get("existingImageUrl")?.toString() ?? "",
    latitude: formData.get("latitude")?.toString() ?? "",
    longitude: formData.get("longitude")?.toString() ?? "",
    locationCity: formData.get("locationCity")?.toString() ?? "",
    locationState: formData.get("locationState")?.toString() ?? "",
    locationCountry: formData.get("locationCountry")?.toString() ?? "",
  });

  if (!parsed.success) {
    return {
      error: parsed.error.errors[0]?.message ?? "Datos inválidos.",
    };
  }

  const {
    eventId,
    name,
    organizationId,
    description,
    startsAt,
    location,
    address,
    capacity,
    existingImageUrl,
    latitude,
    longitude,
    locationCity,
    locationState,
    locationCountry,
  } = parsed.data;

  const startsAtDate = new Date(startsAt);
  if (Number.isNaN(startsAtDate.getTime())) {
    return { error: "Fecha de inicio inválida." };
  }

  const endsAtDate = new Date(startsAtDate.getTime() + 4 * 60 * 60 * 1000);

  let imageUrl = existingImageUrl;
  const coverImage = formData.get("coverImage");
  if (coverImage instanceof File && coverImage.size > 0) {
    if (!coverImage.type.startsWith("image/")) {
      return { error: "La imagen debe ser un archivo válido." };
    }
    if (coverImage.size > 10 * 1024 * 1024) {
      return { error: "La imagen no puede superar los 10MB." };
    }
    try {
      imageUrl = await uploadImageToS3(coverImage);
    } catch (error) {
      console.error("[updateEventAction] Error al subir imagen a Supabase Storage:", error);
      return { error: "No se pudo subir la imagen. Intenta de nuevo." };
    }
  }

  const existingEvent = await db.event.findUnique({
    where: { id: eventId },
    select: {
      locationId: true,
      tickets: {
        select: { id: true },
      },
    },
  });

  if (!existingEvent) {
    return { error: "Evento no encontrado." };
  }

  const locAddress = address?.trim() || location;
  const locUpdateData: {
    name: string;
    address: string;
    image: string;
    city?: string;
    state?: string;
    country?: string;
    latitude?: number;
    longitude?: number;
  } = {
    name: location,
    address: locAddress,
    image: imageUrl,
  };
  if (locationCity?.trim()) locUpdateData.city = locationCity.trim();
  if (locationState?.trim()) locUpdateData.state = locationState.trim();
  if (locationCountry?.trim()) locUpdateData.country = locationCountry.trim();
  // Lat/lng como Number explícito para Prisma (float8 en Supabase)
  if (latitude != null) {
    const latNum = Number(latitude);
    if (!Number.isNaN(latNum)) locUpdateData.latitude = latNum;
  }
  if (longitude != null) {
    const lngNum = Number(longitude);
    if (!Number.isNaN(lngNum)) locUpdateData.longitude = lngNum;
  }
  // Debug: verificar coordenadas antes de Prisma
  console.log("[updateEventAction] Coordenadas recibidas:", {
    formDataLat: formData.get("latitude"),
    formDataLng: formData.get("longitude"),
    parsed: { latitude, longitude },
    locUpdateData: { lat: locUpdateData.latitude, lng: locUpdateData.longitude },
  });

  await db.$transaction(async (tx) => {
    await tx.location.update({
      where: { id: existingEvent.locationId },
      data: locUpdateData,
    });

    await tx.event.update({
      where: { id: eventId },
      data: {
        name,
        about: description,
        image: imageUrl,
        startsAt: startsAtDate,
        endsAt: endsAtDate,
        guildId: organizationId,
      },
    });

    if (existingEvent.tickets[0]) {
      await tx.eventTicket.update({
        where: { id: existingEvent.tickets[0].id },
        data: { quantity: capacity },
      });
    } else {
      await tx.eventTicket.create({
        data: {
          eventId,
          name: "General",
          price: 0,
          quantity: capacity,
          about: "Capacidad total",
        },
      });
    }
  });

  revalidatePath("/admin");
  redirect("/admin?toast=updated");
}

export async function deleteEventAction(eventId: string) {
  await db.event.delete({ where: { id: eventId } });
  revalidatePath("/admin");
  redirect("/admin?toast=deleted");
}
