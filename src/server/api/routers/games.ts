import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "~/server/api/trpc";
import { calculateNewRatings } from "~/utils/tournament";
import { upsertGameNotification } from "./routerUtils";
import { ensureTournamentIsNotLocked } from "./tournaments";
import { TRPCError } from "@trpc/server";

export const gamesRouter = createTRPCRouter({
  getAll: publicProcedure
    .query(({ ctx }) => {
      return ctx.prisma.game.findMany({
        select: {
          id: true,
          time: true,
          player1: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          player2: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          ratings: {
            select: {
              ratingChange: true,
              userId: true
            }
          },
          player1Points: true,
          player2Points: true,
          type: true
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
      if (!ctx.session?.user.email) return
      const sessionUser = await ctx.prisma.user.findFirst({
        where: {
          email: ctx.session?.user.email
        }
      })
      // We do not want to allow a non-admin user to create games in which they were not involved
      if (!sessionUser || (![player1Email, player2Email].includes(sessionUser.email) && sessionUser.role != 'admin')) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Non-admin users must be involved in a newly created game.'
        })
      }
      if (!(player1Email && player2Email)) {
        return
      }
      if (player1Score == 0 && player2Score == 0) {
        return
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
      if (!player1 || !player2) return
      const player1Id = player1.id
      const player2Id = player2.id
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
      const newGame = await ctx.prisma.game.create({
        data: {
          player1Points: input.player1Score,
          player2Points: input.player2Score,
          player1: {
            connect: {
              id: player1Id
            }
          },
          player2: {
            connect: {
              id: player2Id
            }
          },
          userGame: {
            create: [
              ({ userId: player1Id }),
              ({ userId: player2Id })
            ]
          },
          ratings: {
            create: [
              { rating: player1NewRating, userId: player1Id, ratingChange: player1RatingChange },
              { rating: player2NewRating, userId: player2Id, ratingChange: player2RatingChange },
            ]
          },
          lastModifiedUser: {
            connect: {
              id: sessionUser.id
            }
          }
        },
        include: {
          player1: true,
          player2: true,
          notifications: true
        }
      })
      await upsertGameNotification(newGame, 'You are involved in a new game that was created.', ctx.prisma, sessionUser)
      return newGame
    }),
  getGame: protectedProcedure
    .input(z.object({ gameId: z.string() }))
    .query(async ({ ctx, input }) => {
      return await ctx.prisma.game.findFirst({
        where: {
          id: input.gameId
        },
        include: {
          player1: true,
          player2: true,
          notifications: true,
          lastModifiedUser: true
        }
      })
    }),
  deleteGame: protectedProcedure
    .input(z.object({ gameId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const sessionUser = await ctx.prisma.user.findFirst({
        where: {
          email: ctx.session.user.email ?? ''
        }
      })
      const game = await ctx.prisma.game.findFirst({
        where: {
          id: input.gameId
        }
      })
      if (!sessionUser || (![game?.player1Id, game?.player2Id].includes(sessionUser.id) && sessionUser.role != 'admin')) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only users involved, or admin, may delete a game.'
        })
      }
      if (game && game.tournamentId) {
        await ensureTournamentIsNotLocked(ctx.prisma, game.tournamentId)
      }
      return await ctx.prisma.game.delete({
        where: {
          id: input.gameId
        }
      })
    }),
});
