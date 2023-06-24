import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export const tournamentRouter = createTRPCRouter({
  getAll: publicProcedure
    .query(async ({ ctx }) => {
      return await ctx.prisma.tournament.findMany()
    }),
  createTournament: publicProcedure
    .input(z.object({ name: z.string(), playerIds: z.array(z.string()) }))
    .mutation(async ({ ctx, input }) => {
      const t = await ctx.prisma.tournament.findFirst({
        where: {
          name: input.name
        }
      })
      if (t) {
        return;
      }
      return await ctx.prisma.tournament.create({
        data: {
          name: input.name,
          players: {
            connect: input.playerIds.map(playerId => ({ id: playerId }))
          }
        }
      })
    })
});
