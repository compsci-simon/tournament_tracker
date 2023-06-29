import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export const ratingsRouter = createTRPCRouter({
  playerGames: publicProcedure
    .input(z.object({ playerId: z.string() }))
    .query(async ({ ctx, input }) => {
      if (input.playerId == '') {
        return {
          totalGames: 0,
          ratings: [],
          streak: 0,
          currentScore: 0
        }
      }
      const ratings = await ctx.prisma.rating.findMany({
        where: {
          player: {
            id: input.playerId
          }
        },
        orderBy: {
          time: 'asc'
        }
      })
      let streak = 0
      for (let i = 1; i < ratings.length; i++) {
        let miniStreak = 0
        for (; i < ratings.length; i++) {
          if ((ratings[i]?.rating ?? 0) >= (ratings[i - 1]?.rating ?? 0)) {
            miniStreak += 1
            if (miniStreak > streak) {
              streak = miniStreak
            }
          } else {
            break
          }
        }
      }

      return {
        totalGames: ratings.length,
        ratings: ratings.map(game => ({ rating: game.rating, date: game.time })),
        streak,
        currentScore: ratings[ratings.length - 1]?.rating ?? 0
      }
    })
})