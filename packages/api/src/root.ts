import { mobileRouter } from "./router/mobile";
import { webRouter } from "./router/web";
import { createTRPCRouter } from "./trpc";

export type { ArrayElement } from "./types";

export const appRouter = createTRPCRouter({
  web: webRouter,
  mobile: mobileRouter
});

// export type definition of API
export type AppRouter = typeof appRouter;
