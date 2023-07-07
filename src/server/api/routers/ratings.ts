import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { findStreakFromRatings } from "~/utils/utils";
import { Rating } from "@prisma/client";

export const ratingsRouter = createTRPCRouter({
  playerGames: publicProcedure
    .input(z.object({ playerId: z.string() }))
    .query(async ({ ctx, input }) => {
      const emptyGames = {
        totalGames: 0,
        ratings: [] as Rating[],
        streak: 0,
        currentScore: 0,
        avatar: ''
      }
      if (input.playerId == '') {
        return emptyGames
      }
      const user = await ctx.prisma.user.findFirst({
        where: {
          id: input.playerId
        }
      })
      if (!user) {
        return emptyGames
      }
      const ratings: Rating[] = await ctx.prisma.rating.findMany({
        where: {
          player: {
            id: input.playerId
          }
        },
        orderBy: {
          time: 'asc'
        }
      })

      return {
        totalGames: ratings.length - 1,
        ratings,
        streak: findStreakFromRatings(ratings),
        currentScore: ratings[ratings.length - 1]?.rating ?? 0,
        avatar: user.avatar
      }
    })
})