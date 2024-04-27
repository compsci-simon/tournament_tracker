import { Game, PrismaClient, Rating } from "@prisma/client"
import { TRPCError } from "@trpc/server"
import assert from "assert"
import { z } from "zod"
import { calculateNewRatings, getAllTimeTopPlayers, getLeadersFromList, mostGamesUser, weeksBiggestGainer } from "~/utils/tournament"
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc"
import { createGameNotification } from "./routerUtils"
import { findStreakFromRatings } from "~/utils/utils"

const canStartKnockoutRounds = async (prisma: PrismaClient, tournamentId: string) => {
  const groupGames = await prisma.game.findMany({
    where: {
      tournamentId,
      type: 'group',
    },
    select: {
      ratings: true,
    }
  })
  const unplayedGames = groupGames.find(g => g.ratings.length != 2)
  if (unplayedGames) return false;
  const knockoutGames = await prisma.game.findMany({
    where: {
      tournamentId,
      type: 'knockout'
    }
  })
  if (knockoutGames.some(g => g.player1Id)) return false;
  return true
}

const startKnockoutRounds = async (prisma: PrismaClient, tournamentId: string) => {

  const games = await prisma.game.findMany({
    where: {
      tournamentId: tournamentId
    }
  })

  const numberOfPlayersToProgress = games.filter(g => g.level == 0).length * 2
  const playersThatProgress = []
  // Get the players that will progress from the group stages to the knockout stages
  const tournamentPlayerIds = games.reduce((acc, game) => {
    if (game.player1Id && !acc.includes(game.player1Id)) {
      acc.push(game.player1Id)
    }
    if (game.player2Id && !acc.includes(game.player2Id)) {
      acc.push(game.player2Id)
    }
    return acc
  }, [] as string[])
  const playerScores = tournamentPlayerIds
    .reduce((acc, playerId) => {
      const playerWins = games.filter(game => {
        return (game.player1Id == playerId && game.player1Points > game.player2Points)
          || (game.player2Id == playerId && game.player2Points > game.player1Points)
      }).length
      acc.push({ playerId, playerWins })
      return acc
    }, [] as { playerId: string, playerWins: number }[])
    .sort((a, b) => b.playerWins - a.playerWins)

  for (let i = 0; i < numberOfPlayersToProgress; i++) {
    playersThatProgress.push(playerScores[i].playerId)
  }

  const level0Games = games.filter(game => game.level == 0)
  for (let i = 0; i < level0Games.length; i++) {
    const player1Id = playersThatProgress[i * 2]
    const player2Id = playersThatProgress[i * 2 + 1]
    await prisma.game.update({
      where: {
        id: level0Games[i].id
      },
      data: {
        player1: {
          connect: {
            id: player1Id
          }
        },
        player2: {
          connect: {
            id: player2Id
          }
        }
      }
    })
  }
}

const setNextRoundPlayers = async (prisma: PrismaClient, game: Game) => {
  // If this game has no next round, return
  if (!game.nextRoundId) return
  const nextRoundGame = await prisma.game.findFirst({
    where: {
      id: game.nextRoundId
    }
  })
  if (!nextRoundGame) {
    // This is the last game of the tournament
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Next round not found'
    })
  }
  if (game.player1Points == game.player2Points) return null;
  const winnerId = game.player1Points > game.player2Points ? game.player1Id : game.player2Id
  assert(winnerId)
  if (!nextRoundGame.player1Id || [game.player1Id, game.player2Id].includes(nextRoundGame.player1Id)) {
    // If player1Id is not set on the next round or the player from the current round that continues has changed, set player1Id to the new player
    return await prisma.game.update({
      where: {
        id: nextRoundGame.id
      },
      data: {
        player1: {
          connect: {
            id: winnerId
          }
        }
      },
      include: {
        player1: true,
        player2: true
      }
    })
  } else {
    return await prisma.game.update({
      where: {
        id: nextRoundGame.id
      },
      data: {
        player2: {
          connect: {
            id: winnerId
          }
        }
      },
      include: {
        player1: true,
        player2: true
      }
    })
  }
}

const getLongestWinStreak = async (prisma: PrismaClient) => {
  const allRatings = await prisma.rating.findMany()
  const playerRatings = allRatings.reduce((acc, rating) => {
    if (!(rating.userId in acc)) {
      acc[rating.userId] = []
    }
    acc[rating.userId].push(rating)
    return acc
  }, {} as { [key: string]: Rating[] })
  const playerWinStreaks: { userId: string, winStreak: number }[] = []
  Object.entries(playerRatings).forEach(([userId, ratings]) => playerWinStreaks.push({
    userId,
    winStreak: findStreakFromRatings(ratings)
  }))
  playerWinStreaks.sort((a, b) => b.winStreak - a.winStreak)
  const winner = playerWinStreaks.at(0)
  if (!winner) {
    return {
      user: undefined,
      streak: 0
    }
  }
  const user = await prisma.user.findFirst({
    where: {
      id: winner.userId
    }
  })
  return {
    user,
    streak: winner.winStreak
  }
}

export const ensureTournamentIsNotLocked = async (prisma: PrismaClient, tournamentId: string) => {
  const tournamentIsLocked = await prisma.tournament.findFirst({
    where: {
      id: tournamentId
    },
    select: {
      isLocked: true
    }
  })
  console.log('tournamentIsLocked!.isLocked', tournamentIsLocked!.isLocked)
  if (tournamentIsLocked!.isLocked) {
    console.log('Tournament is locked, and cannot be modified.')
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Tournament is locked, and cannot be modified."
    })
  }
}

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
        include: {
          players: true,
          games: {
            include: {
              player1: true,
              player2: true
            }
          }
        }
      })
    }),
  getPlayerGroupGames: protectedProcedure
    .input(z.object({ tournamentId: z.string(), playerId: z.string() }))
    .query(async ({ ctx, input }) => {
      return await ctx.prisma.game.findMany({
        where: {
          tournamentId: input.tournamentId,
          type: 'group',
          OR: [
            { player1Id: input.playerId },
            { player2Id: input.playerId }
          ]
        },
        include: {
          player1: true,
          player2: true
        }
      })
    }),
  joinTournament: protectedProcedure
    .input(z.object({
      tournamentId: z.string().min(1)
    }))
    .mutation(async ({ ctx, input }) => {
      const userEmail = ctx.session.user.email
      await ensureTournamentIsNotLocked(ctx.prisma, input.tournamentId)
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
      await ensureTournamentIsNotLocked(ctx.prisma, input.tournamentId)
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
      if (game && game.tournamentId) {
        await ensureTournamentIsNotLocked(ctx.prisma, game.tournamentId)
      }
      const player1 = game?.player1
      const player2 = game?.player2
      if (!(player1 && player2)) {
        return {
          updatedGame: null,
          nextRound: null
        }
      }
      await ctx.prisma.rating.deleteMany({
        where: {
          gameId: input.gameId
        }
      })
      await ctx.prisma.gameNotification.deleteMany({
        where: {
          gameId: input.gameId
        }
      })
      if (input.player1Points == 0 && input.player2Points == 0) {
        const updatedGame = await ctx.prisma.game.update({
          where: {
            id: input.gameId
          },
          data: {
            player1Points: 0,
            player2Points: 0,
          }
        })
        createGameNotification(game, 'Game score edited', ctx)
        return {
          updatedGame,
          nextRound: null
        }
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
      const updatedGame = await ctx.prisma.game.update({
        where: {
          id: input.gameId
        },
        data: {
          player1Points: input.player1Points,
          player2Points: input.player2Points,
          time: new Date(),
        },
        select: {
          player1: true,
          player2: true,
          type: true,
          tournamentId: true,
          time: true,
          round: true,
          level: true,
          nextRoundId: true,
          id: true,
          player1Points: true,
          player2Points: true,
          player1Id: true,
          player2Id: true,
          poolId: true
        }
      })
      createGameNotification(updatedGame, 'Game score edited', ctx)
      if (updatedGame.type == 'group') {
        const canStart = await canStartKnockoutRounds(ctx.prisma, updatedGame.tournamentId)
        if (canStart) {
          await startKnockoutRounds(ctx.prisma, updatedGame.tournamentId)
        }
      } else if (updatedGame.type == 'knockout') {
        const nextRound = await setNextRoundPlayers(ctx.prisma, updatedGame)
        return {
          updatedGame,
          nextRound
        }
      }
      return {
        updatedGame,
        nextRound: null
      }
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
      const longestStreak = await getLongestWinStreak(ctx.prisma)
      const mostRecentGame = await ctx.prisma.game.findFirst({
        orderBy: {
          time: 'asc'
        },
        include: {
          player1: true,
          player2: true
        }
      })

      return {
        numGames: games.filter(g => { return g.player1Points > 0 || g.player2Points > 0 }).length,
        numPlayers,
        mostGames: mostGamesUser(players, games),
        biggestGainer: weeksBiggestGainer(players, ratings),
        allTimeBest: await getAllTimeTopPlayers(ctx.prisma),
        longestStreak,
        mostRecentGame,
        latestTournamentWinner: null
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
    }),
  switchLock: protectedProcedure
    .input(z.object({ tournamentId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const tournamentLocked = await ctx.prisma.tournament.findFirst({
        where: { id: input.tournamentId }
      })
      return await ctx.prisma.tournament.update({
        where: {
          id: input.tournamentId
        },
        data: {
          isLocked: !tournamentLocked.isLocked
        },
        select: {
          id: true,
          isLocked: true
        }
      })
    })
})
