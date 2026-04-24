import { useState } from "react";
import { Platform } from "react-native";
import Constants from "expo-constants";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, loggerLink } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import superjson from "superjson";

import type { AppRouter } from "@forevent/api";

/**
 * A set of typesafe hooks for consuming your API.
 */
export const api = createTRPCReact<AppRouter>();
export { type RouterInputs, type RouterOutputs } from "@forevent/api";

/**
 * Token de sesión actual. Se inyecta como `Authorization: Bearer <token>` en cada request a tRPC.
 * Lo setea el SessionProvider al login / hidratación y lo limpia al logout.
 * Vive fuera de React porque el httpBatchLink se crea una sola vez en el useState initializer.
 */
let authToken: string | null = null;
export function setAuthToken(token: string | null) {
  authToken = token;
}

const getBaseUrl = () => {
<<<<<<< HEAD
  // Prod: obligatoria via env. Falla explícita si falta para evitar deployments apuntando a localhost.
=======
  // Production override (when running a build). Configurar en .env del monorepo.
>>>>>>> main
  const prodUrl = process.env.EXPO_PUBLIC_API_URL?.trim();

  if (!__DEV__) {
    if (!prodUrl) {
<<<<<<< HEAD
      throw new Error(
        "[api] EXPO_PUBLIC_API_URL no está definida. Configurala en el .env del build de producción.",
      );
=======
      throw new Error("EXPO_PUBLIC_API_URL no definida. Configura la URL del backend en .env antes del build.");
>>>>>>> main
    }
    return prodUrl;
  }

  // Dev: Metro expone el host IP via hostUri (ej "192.168.1.x:8081"). Usamos el mismo host para
  // que el device físico o emulador alcance el Next.js en el puerto 3000.
  const metroHost = Constants.expoConfig?.hostUri?.split(":")[0];

  if (Platform.OS === "android") {
    // Emulador Android: 10.0.2.2 mapea al host; físico en misma Wi-Fi: usar metroHost.
    const isEmulator = !metroHost || metroHost === "localhost";
    return isEmulator ? "http://10.0.2.2:3000" : `http://${metroHost}:3000`;
  }

  return `http://${metroHost ?? "localhost"}:3000`;
};

/**
 * Referencia estable al QueryClient activo.
 * Útil para limpiar la caché desde fuera del árbol de React (ej: signOut en auth.tsx).
 * Se asigna en el useState initializer de TRPCProvider.
 */
export let sharedQueryClient: QueryClient;

/**
 * A wrapper for your app that provides the TRPC context.
 * Use only in _layout.tsx
 */
export function TRPCProvider(props: { children: React.ReactNode }) {
  const [queryClient] = useState(() => {
    const client = new QueryClient();
    sharedQueryClient = client;
    return client;
  });
  const [trpcClient] = useState(() =>
    api.createClient({
      links: [
        loggerLink({
          enabled: (opts) =>
            process.env.NODE_ENV === "development" ||
            (opts.direction === "down" && opts.result instanceof Error),
          colorMode: "ansi",
        }),
        httpBatchLink({
          transformer: superjson,
          url: `${getBaseUrl()}/api/trpc`,
          headers() {
            const headers: Record<string, string> = {
              "x-trpc-source": "expo-react",
            };
            if (authToken) {
              headers.authorization = `Bearer ${authToken}`;
            }
            return headers;
          },
        }),
      ],
    }),
  );

  return (
    <api.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        {props.children}
      </QueryClientProvider>
    </api.Provider>
  );
}
