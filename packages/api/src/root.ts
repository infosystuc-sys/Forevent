import { mobileRouter } from "./router/mobile";
import { webRouter } from "./router/web";
import { createTRPCRouter } from "./trpc";

export const appRouter = createTRPCRouter({
  web: webRouter,
  mobile: mobileRouter
});

// export type definition of API
export type AppRouter = typeof appRouter;

export type ArrayElement<ArrayType extends unknown[] | null> =
  ArrayType extends (infer ElementType)[] ? ElementType : never;
