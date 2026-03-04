import { v4 as uuidv4 } from "uuid";

import { env } from "~/env";
import { supabaseAdmin } from "~/lib/supabase";

const BUCKET = "events";

function sanitizeFileName(name: string) {
  return name.replace(/\s+/g, "-").replace(/[^a-zA-Z0-9._-]/g, "");
}

/**
 * Uploads a File to Supabase Storage and returns its public URL.
 * The `prefix` param maps to a folder inside the "events" bucket.
 */
export async function uploadImageToS3(file: File, prefix = "events"): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const key = `${prefix}/${uuidv4()}-${sanitizeFileName(file.name)}`;

  const { error } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(key, Buffer.from(arrayBuffer), {
      contentType: file.type,
      upsert: false,
    });

  if (error) {
    throw new Error(`Supabase Storage upload failed: ${error.message}`);
  }

  const { data } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(key);
  return data.publicUrl;
}

/**
 * Uploads a raw Buffer to Supabase Storage and returns its public URL.
 * Used by the /api/upload route which receives FormData.
 */
export async function uploadBufferToStorage(
  buffer: Buffer,
  filename: string,
  contentType: string,
  prefix = "events",
): Promise<string> {
  const key = `${prefix}/${uuidv4()}-${sanitizeFileName(filename)}`;

  const { error } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(key, buffer, {
      contentType,
      upsert: false,
    });

  if (error) {
    throw new Error(`Supabase Storage upload failed: ${error.message}`);
  }

  const { data } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(key);
  return data.publicUrl;
}

// Keep env import side-effect-free: suppress unused warning
void env;
