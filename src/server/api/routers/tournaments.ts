import { TRPCError } from "@trpc/server"
import { z } from "zod"
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc"
import { calculateGameSchedule, calculateNewRatings, getLeadersFromList, mostGamesUser, numPlayedGames, playerRankingHistories, weeksBiggestGainer } from "~/utils/tournament"
import { colors } from "~/utils/constants"

const defaultBorderColor = 'rgb(255, 99, 132)'
const defaultBackgroundColor = 'rgba(255, 99, 132, 0.5)'

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
    .input(z.object({ name: z.string(), playerIds: z.array(z.string()), startDate: z.date(), emailReminders: z.boolean(), roundInterval: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const t = await ctx.prisma.tournament.findFirst({
        where: {
          name: input.name
        }
      })
      if (t) {
        return
      }
      const { schedule, numRounds } = calculateGameSchedule(input.playerIds)
      return await ctx.prisma.tournament.create({
        data: {
          name: input.name,
          players: {
            connect: input.playerIds.map(playerId => ({ id: playerId }))
          },
          numRounds: numRounds,
          startDate: input.startDate,
          emailReminders: input.emailReminders,
          roundInterval: input.roundInterval,
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
          players: true
        }
      })
      const player1 = game?.players[0]
      const player2 = game?.players[1]
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
      const { player1NewRating, player2NewRating } = calculateNewRatings(player1Rating?.rating, player2Rating?.rating, input.player1Points > input.player2Points)
      await ctx.prisma.rating.create({
        data: {
          rating: player1NewRating,
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
        }
      })
    }),
  overviewStats: publicProcedure
    .query(async ({ ctx }) => {
      const games = await ctx.prisma.game.findMany({
        include: {
          players: true
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


      return {
        numGames: numPlayedGames(games),
        numPlayers,
        mostGames: mostGamesUser(players, games),
        biggestGainer: weeksBiggestGainer(players, ratings),
        playerRankingHistories: playerRankingHistories(players, ratings)
      }
    }),
  tournamentsStats: publicProcedure
    .query(async ({ ctx }) => {
      const tournaments = await ctx.prisma.tournament.findMany({
        include: {
          players: true
        }
      })
      const allGames = await ctx.prisma.game.findMany({
        include: {
          players: true
        }
      })
      return tournaments.map(tournament => {
        const tournamentGames = allGames.filter(game => game.tournamentId == tournament.id)
        const labels = ['']
        for (let i = 0; i < tournament.numRounds; i++) {
          labels.push(`Round ${i}`)
        }

        const datasets = tournament.players.map((player, index) => {
          const playerTournamentGames = tournamentGames
            .filter(game => {
              return game.players.map(player => player.id).includes(player.id)
            })
            .sort((a, b) => (a.round ?? 0) - (b.round ?? 0))
          const wins: number[] = [0]
          let totalWins = 0
          playerTournamentGames.forEach(game => {
            const playerIndex = game.players.map(p => p.id).indexOf(player.id)
            if (playerIndex == 0 && game.player1Points > game.player2Points) {
              totalWins += 1
            } else if (playerIndex == 1 && game.player2Points > game.player1Points) {
              totalWins += 1
            } else if (playerIndex == -1 || playerIndex > 1) {
              throw new TRPCError({
                code: 'INTERNAL_SERVER_ERROR',
                message: `Index of player in game\'s player attribute is not an elements of [0, 1]: ${playerIndex}`
              })
            }
            wins.push(totalWins)
          })
          return {
            label: `${player.firstName} ${player.lastName}`,
            data: wins,
            borderColor: colors[index]?.borderColor ?? defaultBorderColor,
            backgroundColor: colors[index]?.backgroundColor ?? defaultBackgroundColor,
          }
        })

        return {
          ...tournament,
          chartData: {
            labels,
            datasets
          }
        }
      })
    }),
  deleteTournament: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.game.deleteMany({
        where: {
          tournamentId: input.id
        }
      })
      return await ctx.prisma.tournament.delete({
        where: {
          id: input.id
        }
      })
    }),
  tournamentLeaders: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const games = await ctx.prisma.game.findMany({
        where: {
          tournamentId: input.id
        },
        include: {
          players: true
        }
      })
      if (!games) {
        return
      }
      const playerScoresMap: { [key: string]: { name: string, score: number } } = {}
      games.forEach(game => {
        if (game.players.length == 2
          && (game.player1Points != 0 || game.player2Points != 0)) {

          let player = game.players[0]!
          if (game.player1Points < game.player2Points) {
            player = game.players[1]!
          }
          if (player.id in playerScoresMap) {
            playerScoresMap[player.id]!.score += 1
          } else {
            playerScoresMap[player.id] = {
              name: `${player.firstName} ${player.lastName}`,
              score: 1
            }
          }
        }
      })
      return getLeadersFromList(Object.values(playerScoresMap))
    })
})
