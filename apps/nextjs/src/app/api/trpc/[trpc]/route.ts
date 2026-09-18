import { fetchRequestHandler } from "@trpc/server/adapters/fetch";

import { appRouter, createTRPCContext } from "@forevent/api";
import { auth } from "@forevent/auth";

import { getAllowedOrigins, getSiteUrl } from "~/lib/site-url";

// Orígenes derivados del entorno (AUTH_URL / NEXT_PUBLIC_BASE_URL / VERCEL_URL + dev local)
// en vez de una lista hardcodeada con dominios que no existen o URLs de deploy viejas.
const ALLOWED_ORIGINS = getAllowedOrigins();

function setCorsHeaders(res: Response, origin: string | null) {
  const allowedOrigin =
    origin && ALLOWED_ORIGINS.has(origin) ? origin : getSiteUrl();
  res.headers.set("Access-Control-Allow-Origin", allowedOrigin);
  res.headers.set("Access-Control-Allow-Methods", "OPTIONS, GET, POST");
  res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, x-trpc-source");
  res.headers.set("Vary", "Origin");
}

export function OPTIONS(req: Request) {
  const response = new Response(null, {
    status: 204,
  });
  setCorsHeaders(response, req.headers.get("origin"));
  return response;
}

const handler = auth(async (req) => {
  const response = await fetchRequestHandler({
    endpoint: "/api/trpc",
    router: appRouter,
    req,
    createContext: () =>
      createTRPCContext({
        session: req.auth,
        headers: req.headers,
      }),
    onError({ error, path }) {
      console.error(`>>> tRPC Error on '${path}'`, error);
    },
  });

  setCorsHeaders(response, req.headers.get("origin"));
  return response;
});

export { handler as GET, handler as POST };
