import { uploadBufferToStorage } from "~/lib/s3";

const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

/** Prefixos: events, products, deals, guilds. Bucket: events (Supabase Storage). */
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const prefix = (formData.get("prefix") as string) || "events";

    if (!(file instanceof File)) {
      return Response.json({ error: "No se recibió ningún archivo." }, { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return Response.json({ error: "Solo se permiten imágenes." }, { status: 400 });
    }

    if (file.size > MAX_SIZE) {
      return Response.json({ error: "La imagen no puede superar los 10MB." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const publicUrl = await uploadBufferToStorage(buffer, file.name, file.type, prefix);

    return Response.json({ url: publicUrl });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    console.error("[/api/upload] Error al subir imagen:", error);
    return Response.json({ error: message }, { status: 500 });
  }
}
