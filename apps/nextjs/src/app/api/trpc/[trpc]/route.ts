import { fetchRequestHandler } from "@trpc/server/adapters/fetch";

import { appRouter, createTRPCContext } from "@forevent/api";
import { auth } from "@forevent/auth";

const ALLOWED_ORIGINS = new Set([
  "https://forevent-nextjs-kh85nhbqy-tangopuntohogar-2495s-projects.vercel.app",
  "https://foreventapp.com",
  "https://www.foreventapp.com",
  "http://localhost:3000",
  "http://localhost:8082",
]);

function setCorsHeaders(res: Response, origin: string | null) {
  const allowedOrigin =
    origin && ALLOWED_ORIGINS.has(origin) ? origin : "https://foreventapp.com";
  res.headers.set("Access-Control-Allow-Origin", allowedOrigin);
  res.headers.set("Access-Control-Allow-Methods", "OPTIONS, GET, POST");
  res.headers.set("Access-Control-Allow-Headers", "Content-Type, x-trpc-source");
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
