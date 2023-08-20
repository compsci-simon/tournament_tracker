import { TRPCError } from "@trpc/server"
import { z } from "zod"
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc"
import { calculateNewRatings, getLeadersFromList, mostGamesUser, numPlayedGames, playerRankingHistories, weeksBiggestGainer } from "~/utils/tournament"
import { colors } from "~/utils/constants"

const defaultBorderColor = 'rgb(255, 99, 132)'
const defaultBackgroundColor = 'rgba(255, 99, 132, 0.5)'

export const tournamentRouter = createTRPCRouter({
  getAll: protectedProcedure
    .query(async ({ ctx }) => {
      return await ctx.prisma.tournament.findMany({
        include: {
          players: true
        }
      })
    }),
  createTournament: protectedProcedure
    .input(z.object({
      name: z.string().min(1),
      startDate: z.date(),
      emailReminders: z.boolean(),
      roundInterval: z.string().min(1),
      tournamentType: z.string()
    }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.prisma.tournament.create({
        data: {
          name: input.name,
          numRounds: 0,
          startDate: input.startDate,
          emailReminders: input.emailReminders,
          roundInterval: input.roundInterval,
          type: input.tournamentType,
          TournamentJob: {
            create: {}
          }
        }
      })
    }),
  getTournament: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return await ctx.prisma.tournament.findFirst({
        where: {
          id: input.id
        },
        select: {
          games: {
            include: {
              player1: true,
              player2: true,
            }
          },
          id: true,
          startDate: true,
          roundInterval: true,
          numRounds: true,
          players: true,
          type: true
        }
      })
    }),
  getTournamentPlayerGroupGames: protectedProcedure
    .input(z.object({ tournamentId: z.string(), playerId: z.string() }))
    .query(async ({ ctx, input }) => {
      const x = await ctx.prisma.game.findMany({
        where: {
          tournamentId: input.tournamentId,
          type: 'group',
          OR: [
            { player1Id: input.playerId },
            { player2Id: input.playerId }
          ]
        },
        include: {
          player1: {
            select: {
              name: true,
              id: true
            }
          },
          player2: {
            select: {
              name: true,
              id: true
            }
          },
          Tournament: {
            select: {
              name: true
            }
          }
        }
      })
      return x
    }),
  joinTournament: protectedProcedure
    .input(z.object({
      tournamentId: z.string().min(1)
    }))
    .mutation(async ({ ctx, input }) => {
      const userEmail = ctx.session.user.email
      const player = await ctx.prisma.user.findFirst({
        where: {
          email: userEmail ?? ''
        }
      })
      if (!player) {
        return new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to find the user associated to your session"
        })
      }
      return await ctx.prisma.tournament.update({
        where: {
          id: input.tournamentId
        },
        data: {
          players: {
            connect: [({ id: player.id })]
          }
        },
        include: {
          players: true
        }
      })
    }),
  leaveTournament: protectedProcedure
    .input(z.object({ tournamentId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const userEmail = ctx.session.user.email
      const player = await ctx.prisma.user.findFirst({
        where: {
          email: userEmail ?? ''
        }
      })
      if (!player) {
        return new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to find the user associated to your session"
        })
      }
      return await ctx.prisma.tournament.update({
        where: {
          id: input.tournamentId
        },
        data: {
          players: {
            disconnect: [({ id: player.id })]
          }
        },
        include: {
          players: true
        }
      })
    }),
  setGamePoints: protectedProcedure
    .input(z.object({
      gameId: z.string(),
      player1Points: z.number().gte(0),
      player2Points: z.number().gte(0)
    }))
    .mutation(async ({ ctx, input }) => {
      const game = await ctx.prisma.game.findFirst({
        where: {
          id: input.gameId
        },
        include: {
          player1: true,
          player2: true,
        }
      })
      const player1 = game?.player1
      const player2 = game?.player2
      if (!(player1 && player2)) {
        return
      }
      await ctx.prisma.rating.deleteMany({
        where: {
          gameId: input.gameId
        }
      })
      if (input.player1Points == 0 && input.player2Points == 0) {
        return await ctx.prisma.game.update({
          where: {
            id: input.gameId
          },
          data: {
            player1Points: 0,
            player2Points: 0,
          }
        })
      }
      const player1Rating = await ctx.prisma.rating.findFirst({
        where: {
          userId: player1?.id ?? ''
        },
        orderBy: {
          time: 'desc'
        }
      })
      const player2Rating = await ctx.prisma.rating.findFirst({
        where: {
          userId: player2?.id ?? ''
        },
        orderBy: {
          time: 'desc'
        }
      })
      const { player1NewRating, player2NewRating, player1RatingChange, player2RatingChange } = calculateNewRatings(player1Rating.rating, player2Rating.rating, input.player1Points > input.player2Points)
      await ctx.prisma.rating.create({
        data: {
          rating: player1NewRating,
          ratingChange: player1RatingChange,
          player: {
            connect: ({ id: player1.id })
          },
          game: {
            connect: ({ id: game.id })
          }
        }
      })
      await ctx.prisma.rating.create({
        data: {
          rating: player2NewRating,
          ratingChange: player2RatingChange,
          player: {
            connect: ({ id: player2.id })
          },
          game: {
            connect: ({ id: game.id })
          }
        }
      })
      return ctx.prisma.game.update({
        where: {
          id: input.gameId
        },
        data: {
          player1Points: input.player1Points,
          player2Points: input.player2Points,
          time: new Date()
        }
      })
    }),
  overviewStats: protectedProcedure
    .query(async ({ ctx }) => {
      const games = await ctx.prisma.game.findMany({
        include: {
          player1: true,
          player2: true,
        }
      })
      const numPlayers = (await ctx.prisma.user.findMany()).length
      const players = await ctx.prisma.user.findMany()
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const ratings = await ctx.prisma.rating.findMany({
        where: {
          time: {
            gt: oneWeekAgo
          }
        },
        include: {
          player: true
        }
      })

      const x = await ctx.prisma.user.findMany({
        include: {
          _count: { select: { userGames: true } }
        },
      })
      console.log(x)

      return {
        numGames: numPlayedGames(games),
        numPlayers,
        mostGames: mostGamesUser(players, games),
        biggestGainer: weeksBiggestGainer(players, ratings),
        playerRankingHistories: playerRankingHistories(players, ratings)
      }
    }),
  tournamentsStats: protectedProcedure
    .query(async ({ ctx }) => {
      const tournaments = await ctx.prisma.tournament.findMany({
        include: {
          players: true
        },
        orderBy: {
          startDate: 'desc'
        }
      })
      const allGames = await ctx.prisma.game.findMany({
        include: {
          player1: true,
          player2: true,
        }
      })
      return tournaments.map(tournament => {
        const tournamentGames = allGames.filter(game => game.tournamentId == tournament.id)
        const players = tournament.players.map(player => {
          const playerGames = tournamentGames.filter(game => {
            return game.player1Id == player.id || game.player2Id == player.id
          })
          const wins = playerGames.filter(game => {
            return (game.player1Id == player.id && game.player1Points > game.player2Points)
              || (game.player2Id == player.id && game.player2Points > game.player1Points)
          }).length
          const losses = playerGames.filter(game => {
            return (game.player1Id == player.id && game.player1Points < game.player2Points)
              || (game.player2Id == player.id && game.player2Points < game.player1Points)
          }).length
          return {
            name: player.name,
            email: player.email,
            wins,
            losses
          }
        })
        console.log(players)
        return {
          ...tournament,
          players
        }
      })
    }),
  tournamentLeaders: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const games = await ctx.prisma.game.findMany({
        where: {
          tournamentId: input.id
        },
        include: {
          player1: true,
          player2: true,
        }
      })
      if (!games) {
        return
      }
      const playerScoresMap: { [key: string]: { name: string, score: number } } = {}
      games.forEach(game => {
        if (game.player1 && game.player2
          && (game.player1Points != 0 || game.player2Points != 0)) {

          let player = game.player1
          if (game.player1Points < game.player2Points) {
            player = game.player2
          }
          if (player.id in playerScoresMap) {
            playerScoresMap[player.id]!.score += 1
          } else {
            playerScoresMap[player.id] = {
              name: player.name,
              score: 1
            }
          }
        }
      })
      return getLeadersFromList(Object.values(playerScoresMap))
    })
})
