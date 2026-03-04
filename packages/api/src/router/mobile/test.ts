import { CreatePostSchema } from "@forevent/validators";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure, publicProcedure } from "../../trpc";
import { TRPCError } from "@trpc/server";

export const testRouter = createTRPCRouter({
  all: publicProcedure.query(async ({ ctx }) => {

    console.log("se hizo la query")

    const data = await fetch("https://rickandmortyapi.com/api/character", {});

    // console.log("hay data")

    if (!data.ok) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Error fetching data from rickandmortyapi.com",
      }
      );
    }

    const validated = await data.json()

    const datazo: {
      id: number,
      name: string,
      status: string,
      species: string,
      type: string,
      gender: string,
      origin: { name: string, url: string },
      location: { name: string, url: string },
      image: string,
      episode: string[],
      url: string,
      created: string,
    }[] = validated.results

    // console.log(validated, "validated!", typeof (validated))

    return datazo
  }),

  byId: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      console.log("se hizo la query", input)

      const data = await fetch(`https://rickandmortyapi.com/api/character/${input.id}`);

      console.log("hay data")

      if (!data.ok) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Error fetching data from rickandmortyapi.com",
        }
        );
      }

      const validated = await data.json()

      const datazo: {
        id: number,
        name: string,
        status: string,
        species: string,
        type: string,
        gender: string,
        origin: { name: string, url: string },
        location: { name: string, url: string },
        image: string,
        episode: string[],
        url: string,
        created: string,
      } = validated.results
      // return ctx.db.select().from(schema.post).orderBy(desc(schema.post.id));
      return validated
    }),

  create: protectedProcedure
    .input(CreatePostSchema)
    .mutation(({ ctx, input }) => {
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
