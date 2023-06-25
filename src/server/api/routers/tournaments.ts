import { Games, PlaylistRemoveSharp } from "@mui/icons-material";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { calculateGameSchedule } from "~/utils/tournament";

const colors = [
  {
    borderColor: 'rgb(123, 45, 67)',
    backgroundColor: 'rgba(123, 45, 67, 0.5)'
  },
  {
    borderColor: 'rgb(89, 145, 200)',
    backgroundColor: 'rgba(89, 145, 200, 0.5)'
  },
  {
    borderColor: 'rgb(32, 178, 90)',
    backgroundColor: 'rgba(32, 178, 90, 0.5)'
  },
  {
    borderColor: 'rgb(210, 87, 153)',
    backgroundColor: 'rgba(210, 87, 153, 0.5)'
  },
  {
    borderColor: 'rgb(64, 192, 132)',
    backgroundColor: 'rgba(64, 192, 132, 0.5)'
  },
  {
    borderColor: 'rgb(180, 120, 20)',
    backgroundColor: 'rgba(180, 120, 20, 0.5)'
  },
  {
    borderColor: 'rgb(26, 102, 186)',
    backgroundColor: 'rgba(26, 102, 186, 0.5)'
  },
  {
    borderColor: 'rgb(142, 68, 173)',
    backgroundColor: 'rgba(142, 68, 173, 0.5)'
  },
  {
    borderColor: 'rgb(255, 128, 0)',
    backgroundColor: 'rgba(255, 128, 0, 0.5)'
  },
  {
    borderColor: 'rgb(221, 75, 57)',
    backgroundColor: 'rgba(221, 75, 57, 0.5)'
  },
  {
    borderColor: 'rgb(60, 180, 75)',
    backgroundColor: 'rgba(60, 180, 75, 0.5)'
  },
  {
    borderColor: 'rgb(70, 130, 180)',
    backgroundColor: 'rgba(70, 130, 180, 0.5)'
  },
  {
    borderColor: 'rgb(0, 0, 128)',
    backgroundColor: 'rgba(0, 0, 128, 0.5)'
  },
  {
    borderColor: 'rgb(255, 215, 0)',
    backgroundColor: 'rgba(255, 215, 0, 0.5)'
  },
  {
    borderColor: 'rgb(139, 69, 19)',
    backgroundColor: 'rgba(139, 69, 19, 0.5)'
  },
  {
    borderColor: 'rgb(218, 112, 214)',
    backgroundColor: 'rgba(218, 112, 214, 0.5)'
  },
  {
    borderColor: 'rgb(0, 128, 128)',
    backgroundColor: 'rgba(0, 128, 128, 0.5)'
  },
  {
    borderColor: 'rgb(184, 134, 11)',
    backgroundColor: 'rgba(184, 134, 11, 0.5)'
  },
  {
    borderColor: 'rgb(95, 158, 160)',
    backgroundColor: 'rgba(95, 158, 160, 0.5)'
  },
  {
    borderColor: 'rgb(128, 0, 0)',
    backgroundColor: 'rgba(128, 0, 0, 0.5)'
  }
];


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
    }),
  overviewStats: publicProcedure
    .query(async ({ ctx }) => {
      const numGames = (await ctx.prisma.game.findMany()).length
      const numPlayers = (await ctx.prisma.user.findMany()).length
      const players = await ctx.prisma.user.findMany()
      const totalGames: { [key: string]: number } = {}
      players.forEach(player => {
        totalGames[player.id] = 0
      })
      const games = await ctx.prisma.game.findMany({
        include: {
          players: true
        }
      })
      games.forEach(game => {
        if (game.players.length == 2
          && (game.player1Points > 0 || game.player2Points > 0)) {

          game.players.forEach(player => {
            totalGames[player.id] += 1
          })
        }
      })
      const totalGamesArray = Object.entries(totalGames)
      const sortedTotalGames = totalGamesArray.sort((a, b) => b[1] - a[1])

      const mostPlayingPlayer = await ctx.prisma.user.findFirst({
        where: {
          id: sortedTotalGames ? sortedTotalGames[0] ? sortedTotalGames[0][0] : 'Noone' : 'Noone'
        }
      })


      return {
        numGames,
        numPlayers,
        mostGames: {
          player: `${mostPlayingPlayer?.firstName} ${mostPlayingPlayer?.lastName}`,
          value: sortedTotalGames ? sortedTotalGames[1] ? sortedTotalGames[1][1] : 0 : 0
        }
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
        const labels = ['', 'Round 0']
        let round = 0
        tournamentGames.forEach(game => {
          if (game.round > round) {
            round++
            labels.push(`Round ${round}`)
          }
        })

        const datasets = tournament.players.map((player, index) => {
          const playerTournamentGames = tournamentGames
            .filter(game => {
              return game.players.map(player => player.id).includes(player.id)
            })
            .sort((a, b) => a.round - b.round)
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
    })
});
