import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";

export const sportsRouter = createTRPCRouter({
  create: protectedProcedure
    .input(z.object({ name: z.string(), icon: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.prisma.sport.create({
        data: {
          name: input.name,
          icon: input.icon
        }
      })
    }),
  all: protectedProcedure
    .query(async ({ ctx }) => {
      return await ctx.prisma.sport.findMany()
    })
})