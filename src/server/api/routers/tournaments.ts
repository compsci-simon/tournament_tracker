import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { calculateGameSchedule } from "~/utils/tournament";

export const tournamentRouter = createTRPCRouter({
  getAll: publicProcedure
    .query(async ({ ctx }) => {
      return await ctx.prisma.tournament.findMany({
        include: {
          players: true
        }
      })
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
      const schedule = calculateGameSchedule(input.playerIds)
      return await ctx.prisma.tournament.create({
        data: {
          name: input.name,
          players: {
            connect: input.playerIds.map(playerId => ({ id: playerId }))
          },
          games: {
            create: schedule.map(game => {
              const gamePlayers = [({ id: game.player1 })]
              if (game.player2) {
                gamePlayers.push(({ id: game.player2 }))
              }
              return {
                round: game.round,
                players: {
                  connect: gamePlayers
                },
              }
            })
          }
        }
      })
    }),
  getTournament: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return await ctx.prisma.tournament.findFirst({
        where: {
          id: input.id
        },
        select: {
          games: {
            include: {
              players: true
            }
          }
        }
      })
    }),
  setGamePoints: publicProcedure
    .input(z.object({ gameId: z.string(), player1Points: z.number(), player2Points: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const game = ctx.prisma.game.findFirst({
        where: {
          id: input.gameId
        }
      })
      if (!game) {
        return
      }
      return ctx.prisma.game.update({
        where: {
          id: input.gameId
        },
        data: {
          player1Points: input.player1Points,
          player2Points: input.player2Points,
        }
      })
    })
});
