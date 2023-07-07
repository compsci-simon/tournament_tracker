import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { calculateNewRatings } from "~/utils/tournament";

export const gamesRouter = createTRPCRouter({
  getAll: publicProcedure
    .query(({ ctx }) => {
      return ctx.prisma.game.findMany({
        include: {
          players: true,
          ratings: true
        },
        where: {
          OR: [
            { player1Points: { gt: 0 } },
            { player2Points: { gt: 0 } },
          ]
        },
        orderBy: {
          time: 'desc'
        }
      });
    }),
  createQuickGame: publicProcedure
    .input(z.object({
      player1Email: z.string(),
      player2Email: z.string(),
      player1Score: z.number().gte(0),
      player2Score: z.number().gte(0)
    }))
    .mutation(async ({ ctx, input }) => {
      const { player1Email, player2Email, player1Score, player2Score } = input
      if (!(player1Email && player2Email)) {
        return
      }
      if (player1Score == 0 && player2Score == 0) {
        return;
      }
      const player1 = await ctx.prisma.user.findFirst({
        where: {
          email: player1Email
        }
      })
      const player2 = await ctx.prisma.user.findFirst({
        where: {
          email: player2Email
        }
      })
      const player1Id: string = player1.id
      const player2Id: string = player2.id
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
      if (!player1Rating || !player2Rating) {
        return
      }
      const {
        player1NewRating,
        player2NewRating,
        player1RatingChange,
        player2RatingChange,
      } = calculateNewRatings(player1Rating.rating, player2Rating.rating, player1Score > player2Score)
      return await ctx.prisma.game.create({
        data: {
          player1Points: input.player1Score,
          player2Points: input.player2Score,
          player1Id,
          player2Id,
          players: {
            connect: [({ id: player1Id }), ({ id: player2Id })]
          },
          ratings: {
            create: [
              { rating: player1NewRating, userId: player1Id, ratingChange: player1RatingChange },
              { rating: player2NewRating, userId: player2Id, ratingChange: player2RatingChange },
            ]
          }
        }
      })
    }),
});
