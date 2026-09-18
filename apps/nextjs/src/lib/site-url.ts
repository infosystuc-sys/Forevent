/**
 * URL pública del sitio, derivada del entorno en vez de hardcodear un dominio.
 *
 * `foreventapp.com` no está registrado (RDAP 404), así que hoy producción vive en
 * `forevent-nextjs.vercel.app`. Cuando exista un dominio propio alcanza con setear
 * `AUTH_URL` / `NEXT_PUBLIC_BASE_URL` en Vercel; no hay que tocar código.
 *
 * Orden: AUTH_URL (la que Google OAuth ya valida como real) → NEXT_PUBLIC_BASE_URL
 * → VERCEL_URL (deployment actual) → localhost.
 */
function normalize(raw: string | undefined): string | undefined {
  const v = raw?.trim();
  if (!v) return undefined;
  const withProto = /^https?:\/\//i.test(v) ? v : `https://${v}`;
  return withProto.replace(/\/+$/, "");
}

export function getSiteUrl(): string {
  return (
    normalize(process.env.AUTH_URL) ??
    normalize(process.env.NEXT_PUBLIC_BASE_URL) ??
    normalize(process.env.VERCEL_URL) ??
    `http://localhost:${process.env.PORT ?? 3000}`
  );
}

/** Orígenes permitidos para CORS: todas las URLs conocidas del sitio + dev local. */
export function getAllowedOrigins(): Set<string> {
  const origins = [
    normalize(process.env.AUTH_URL),
    normalize(process.env.NEXT_PUBLIC_BASE_URL),
    normalize(process.env.VERCEL_URL),
    "http://localhost:3000",
    "http://localhost:8082",
  ].filter((o): o is string => !!o);
  return new Set(origins);
}
