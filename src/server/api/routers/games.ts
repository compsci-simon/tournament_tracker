import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { calculateNewRatings } from "~/utils/tournament";

export const gamesRouter = createTRPCRouter({
  getAll: publicProcedure.query(({ ctx }) => {
    return ctx.prisma.game.findMany();
  }),
  createQuickGame: publicProcedure
    .input(z.object({
      player1Id: z.string(),
      player2Id: z.string(),
      player1Score: z.number().gte(0),
      player2Score: z.number().gte(0)
    }))
    .mutation(async ({ ctx, input }) => {
      const { player1Id, player2Id, player1Score, player2Score } = input
      if (!(player1Id && player2Id)) {
        return
      }
      if (player1Score == 0 && player2Score == 0) {
      }
      const player1Rating = await ctx.prisma.rating.findFirst({
        where: {
          userId: player1Id
        },
        orderBy: {
          time: 'desc'
        }
      })
      const player2Rating = await ctx.prisma.rating.findFirst({
        where: {
          userId: player2Id
        },
        orderBy: {
          time: 'desc'
        }
      })
      const { player1NewRating, player2NewRating } = calculateNewRatings(player1Rating?.rating, player2Rating?.rating, player1Score > player2Score)
      return await ctx.prisma.game.create({
        data: {
          player1Points: input.player1Score,
          player2Points: input.player2Score,
          players: {
            connect: [({ id: input.player1Id }), ({ id: input.player2Id })]
          },
          ratings: {
            create: [
              { rating: player1NewRating, userId: player1Id },
              { rating: player2NewRating, userId: player2Id },
            ]
          }
        }
      })
    }),
});
