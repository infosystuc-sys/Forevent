import { z } from "zod";
import { CreatePostSchema } from "@forevent/validators";

import { createTRPCRouter, protectedProcedure, publicProcedure } from "../../trpc";

export const gateRouter = createTRPCRouter({
  all: publicProcedure.query(({ ctx }) => {
    // return ctx.db.select().from(schema.post).orderBy(desc(schema.post.id));
    return
  }),

  byId: publicProcedure.input(z.object({ id: z.number() })).query(({ ctx, input }) => {
    // return ctx.db
    //   .select()
    //   .from(schema.post)
    //   .where(eq(schema.post.id, input.id));

    return
  }),

  create: protectedProcedure.input(z.object({

  })).mutation(({ ctx, input }) => {
    return
  }),

  update: protectedProcedure
    .input(CreatePostSchema)
    .mutation(({ ctx, input }) => {
      return
    }),

  delete: protectedProcedure.input(z.number()).mutation(({ ctx, input }) => {
    return
  }),
});
