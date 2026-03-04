import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../../trpc";
import { TRPCError } from "@trpc/server";


export const locationRouter = createTRPCRouter({
  all: protectedProcedure.input(z.object({ guildId: z.string() })).query(async ({ ctx, input }) => {
      const locations = await ctx.prisma.location.findMany({ where: { event: { guildId: input.guildId } } })
      console.log("first locations", locations)
      return locations
    }),

  byId: publicProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
    const location = await ctx.prisma.location.findUnique({
      where: { id: input.id }
    })
    return location
  }),

  create: protectedProcedure.input(z.object({

  })).mutation(({ ctx, input }) => {
    return
  }),

  delete: protectedProcedure.input(z.string()).mutation(async ({ ctx, input }) => {
    return await ctx.prisma.location.update({
      where: { id: input },
      data: { discharged: false }
    })
  }),


  modifyLocation: protectedProcedure.input(
    z.object({
      address: z.string().optional(),
      name: z.string().optional(),
      latitude: z.number().optional(),
      longitude: z.number().optional(),
      locationId: z.string(),
      radius: z.number().optional(),
      image: z.string().optional(),
      discharged: z.boolean().optional(),
    })
  ).mutation(async ({ ctx, input }) => {
    const body = input
    const data = (({ locationId, ...obj }) => obj)(body)

    console.log(body, 'YEAH BUDDY')

    const location = await ctx.prisma.location.update({
      where: {
        id: body.locationId
      },
      data,
      select: {
        id: true,
        name: true,
        createdAt: true,
      }
    })

    console.log(location, "location")

    if (!location) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Ocurrio un error al dar de baja la ubicacion.',
      });
    }

    return location
  }),

  getLocations: protectedProcedure.input(
    z.object({
      guildId: z.string(),
    }),
  ).query(async ({ ctx, input }) => {
    const body = input
    // console.log(body, 'YEAH BUDDY')

    const locations = await ctx.prisma.location.findMany({
      where: { event: { guildId: body.guildId, discharged: true } },
      select: {
        id: true,
        name: true,
        image: true,
        latitude: true,
        longitude: true,
        address: true,
        iana: true,
      }
    })

    // console.log(locations, "locations")

    if (!locations) {
      return []
    }

    return locations
  }),

  getUniqueLocation: protectedProcedure.input(z.object({
    locationId: z.string(),
  }),).query(async ({ ctx, input }) => {
    const body = input
    // console.log(body, 'YEAH BUDDY')

    const location = await ctx.prisma.location.findUnique({
      where: {
        id: body.locationId
      },
      select: {
        id: true,
        name: true,
        image: true,
        latitude: true,
        longitude: true,
        address: true,
        iana: true,
      }
    })

    if (!location) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'No se encontró la ubicación.',
      });
    }

    return location
  }),
});