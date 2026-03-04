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

const getBaseUrl = () => {
  // Production override (when running a build)
  const prodUrl = "https://www.foreventapp.com";

  if (!__DEV__) return prodUrl;

  // Metro Bundler exposes the host IP via hostUri (e.g. "192.168.1.x:8081")
  // We strip the Metro port and use Next.js port 3000 instead.
  const metroHost = Constants.expoConfig?.hostUri?.split(":")[0];

  if (Platform.OS === "android") {
    // Android Emulator: 10.0.2.2 maps to the host machine's localhost
    // Physical device on same Wi-Fi: use the Metro host IP directly
    const isEmulator = !metroHost || metroHost === "localhost";
    return isEmulator
      ? "http://10.0.2.2:3000"
      : `http://${metroHost}:3000`;
  }

  // iOS Simulator & web: Metro host or fallback to localhost
  return `http://${metroHost ?? "localhost"}:3000`;
};

/**
 * Referencia estable al QueryClient activo.
 * Útil para limpiar la caché desde fuera del árbol de React (ej: signOut en auth.tsx).
 * Se asigna en el useState initializer de TRPCProvider, por lo que siempre está definido
 * antes de cualquier interacción del usuario.
 */
export let sharedQueryClient: QueryClient

/**
 * A wrapper for your app that provides the TRPC context.
 * Use only in _layout.tsx
 */
export function TRPCProvider(props: { children: React.ReactNode }) {
  const [queryClient] = useState(() => {
    const client = new QueryClient()
    sharedQueryClient = client
    return client
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
            const headers = new Map<string, string>();
            headers.set("x-trpc-source", "expo-react");
            return Object.fromEntries(headers);
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