import { Game, PrismaClient, Rating, User } from "@prisma/client"
import { TRPCError } from "@trpc/server"
import assert from "assert"
import { z } from "zod"
import { calculateNewRatings, getAllTimeTopPlayers, getLeadersFromList, mostGamesUser, weeksBiggestGainer } from "~/utils/tournament"
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc"
import { getUser, upsertGameNotification } from "./routerUtils"
import { findStreakFromRatings, getServerSettings } from "~/utils/utils"
import * as fs from 'fs'

const canStartKnockoutRounds = async (prisma: PrismaClient, tournamentId: string) => {
  const games = await prisma.game.findMany({ where: { tournamentId } })
  const unplayedGroupGame = games
    .filter(game => game.type == 'group')
    .some(game => game.player1Points == 0 && game.player2Points == 0)
  if (unplayedGroupGame) return false;
  const knockoutRoundsHaveStarted = games
    .filter(game => game.type == 'knockout')
    .some(game => game.player1Points > 0 || game.player2Points > 0)
  return !knockoutRoundsHaveStarted
}

const startKnockoutRounds = async (prisma: PrismaClient, tournamentId: string) => {

  const canStart = await canStartKnockoutRounds(prisma, tournamentId)
  if (!canStart) return
  console.log('Starting knockout games')
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
        player1: { connect: { id: player1Id } },
        player2: { connect: { id: player2Id } }
      }
    })
  }
}

const setNextRoundPlayers = async (prisma: PrismaClient, game: Game) => {
  // If this game has no next round, return
  const nextRoundGame = await prisma.game.findFirst({
    where: {
      id: game.nextRoundId!
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

/**
 * This function updates the ratings of users involved in a game. It cascades these updates to influence all subsequent games.
 */
const updatePlayerRatings = async (prisma: PrismaClient, gameId: string) => {
  const game = await prisma.game.findFirst({
    where: { id: gameId },
    include: { ratings: true }
  })
  assert(game)
  const player1Id = game.player1Id!
  const player2Id = game.player2Id!
  const previousPlayer1RatingItem = await prisma.rating.findFirst({
    where: { userId: game.player1Id!, time: { lt: game.time } },
    orderBy: { time: 'desc' }
  })
  const previousPlayer2RatingItem = await prisma.rating.findFirst({
    where: { userId: game.player2Id!, time: { lt: game.time } },
    orderBy: { time: 'desc' }
  })
  const {
    player1NewRating,
    player2NewRating,
    player1RatingChange,
    player2RatingChange
  } = calculateNewRatings(previousPlayer1RatingItem!.rating, previousPlayer2RatingItem!.rating, game.player1Points > game.player2Points)

  if (game.ratings.length == 0) {
    // There are currently no ratings
    await prisma.rating.create({
      data: {
        rating: player1NewRating,
        ratingChange: player1RatingChange,
        player: { connect: { id: player1Id } },
        game: { connect: { id: game.id } },
        cause: 'game'
      }
    })
    await prisma.rating.create({
      data: {
        rating: player2NewRating,
        ratingChange: player2RatingChange,
        player: { connect: { id: player2Id } },
        game: { connect: { id: game.id } },
        cause: 'game'
      }
    })
    await prisma.game.update({
      where: { id: game.id },
      data: { time: new Date() }
    })
    return
  } else {
    // Update the old ratings
    const player1RatingItem = game.ratings.find(rating => rating.userId == player1Id)!
    const player2RatingItem = game.ratings.find(rating => rating.userId == player2Id)!
    await prisma.rating.update({
      where: {
        id: player1RatingItem.id
      },
      data: {
        rating: player1NewRating,
        ratingChange: player1RatingChange
      }
    })
    await prisma.rating.update({
      where: {
        id: player2RatingItem.id
      },
      data: {
        rating: player2NewRating,
        ratingChange: player2RatingChange
      }
    })
    // Update every rating of player 1 since the game
    const player1Ratings = await prisma.rating.findMany({
      where: { userId: player1Id, time: { gt: game.time } },
      orderBy: { time: 'asc' },
      select: { id: true, ratingChange: true }
    })
    let newRating = player1NewRating
    for (const rating of player1Ratings) {
      newRating = newRating += rating.ratingChange
      await prisma.rating.update({ where: { id: rating.id }, data: { rating: newRating } })
    }
    // Update every rating of player 2 since the game
    const player2Ratings = await prisma.rating.findMany({
      where: { userId: player2Id, time: { gt: game.time } },
      orderBy: { time: 'asc' },
      select: { id: true, ratingChange: true }
    })
    newRating = player2NewRating
    for (const rating of player2Ratings) {
      newRating = newRating += rating.ratingChange
      await prisma.rating.update({ where: { id: rating.id }, data: { rating: newRating } })
    }
  }
}

/**
 * This method ensures that only a user that participated in a game (or an admin)
 * can modify the game results. This prevents users from going about changing
 * scores for games they were not involved in.
 */
const assertUserCanUpdateGame = (user: User, game: Game) => {
  if (!user || (![game.player1Id, game.player2Id].includes(user.id) && user.role != 'admin')) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'You have to be an involved in the game, or be an admin, to change the score'
    })
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

const setTournamentWinner = async (prisma: PrismaClient, tournamentId: string | null) => {
  if (!tournamentId) return

  const games = await prisma.game.findMany({ where: { tournamentId: tournamentId } })
  const allGamesFinished = games
    .every(game => game.player1Points > 0 || game.player2Points > 0)
  if (!allGamesFinished) return

  const sortedGames = games
    .filter(game => game.type == 'knockout')
    .sort((a, b) => b.level! - a.level!)

  assert(sortedGames.at(0)!.level! > sortedGames.at(1)!.level!)
  const lastGame = sortedGames.at(0)!
  const winnerId = lastGame.player1Points > lastGame.player2Points ? lastGame.player1Id : lastGame.player2Id
  assert(winnerId)
  const serverSettings = getServerSettings()
  const lastRating = await prisma.rating.findFirst({ orderBy: { time: 'desc' } })
  assert(lastRating)
  await prisma.rating.update({
    where: { id: lastRating.id },
    data: {
      rating: lastRating.rating + serverSettings.tournamentBonusElo ?? 0,
      ratingChange: lastRating.ratingChange + serverSettings.tournamentBonusElo ?? 0,
    }
  })

  await prisma.tournament.update({
    where: { id: tournamentId },
    data: { winner: { connect: { id: winnerId } }, isLocked: true }
  })
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
      tournamentType: z.string(),
      sportId: z.string()
    }))
    .mutation(async ({ ctx, input }) => {
      const found = await ctx.prisma.sport.findFirst({ where: { id: input.sportId } })
      if (!found) {
        return new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to find the assosciated sport"
        })
      }
      return await ctx.prisma.tournament.create({
        data: {
          name: input.name,
          numRounds: 0,
          startDate: input.startDate,
          type: input.tournamentType,
          TournamentJob: {
            create: {}
          },
          sport: {
            connect: {
              id: input.sportId
            }
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
      const sessionUser = await getUser(ctx.prisma, ctx.session.user.email!)
      const game = await ctx.prisma.game.findFirst({
        where: { id: input.gameId },
        include: { player1: true, player2: true, notifications: true }
      })
      assert(sessionUser && game)

      if (game.tournamentId) {
        await ensureTournamentIsNotLocked(ctx.prisma, game.tournamentId)
      }

      assertUserCanUpdateGame(sessionUser, game)
      assert(game?.player1 && game?.player2)
      const updatedGame = await ctx.prisma.game.update({
        where: {
          id: input.gameId
        },
        data: {
          player1Points: input.player1Points,
          player2Points: input.player2Points,
          lastModifiedTime: new Date(),
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
      await updatePlayerRatings(ctx.prisma, game.id!)
      await upsertGameNotification(updatedGame, 'Game score edited', ctx.prisma, sessionUser)

      await setTournamentWinner(ctx.prisma, game.tournamentId)
      if (updatedGame.type == 'group') {
        await startKnockoutRounds(ctx.prisma, updatedGame.tournamentId!)
        return {
          updatedGame,
          nextRound: null
        }
      } else if (updatedGame.type == 'knockout') {
        const nextRound = await setNextRoundPlayers(ctx.prisma, updatedGame)
        return {
          updatedGame,
          nextRound
        }
      } else {
        // For non tournament games
        return {
          updatedGame,
          nextRound: null
        }
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
          time: 'desc'
        },
        where: {
          OR: {
            player1Points: {
              gt: 0
            },
            player2Points: {
              gt: 0
            }
          }
        },
        include: {
          player1: true,
          player2: true
        }
      })
      // assert(mostRecentGame)
      const latestTournamentWinner = await ctx.prisma.tournament.findFirst({
        where: { winnerId: { not: null } },
        orderBy: { startDate: 'desc' },
        include: { winner: true }
      })

      return {
        numGames: games.filter(g => { return g.player1Points > 0 || g.player2Points > 0 }).length,
        numPlayers,
        mostGames: mostGamesUser(players, games),
        biggestGainer: weeksBiggestGainer(players, ratings),
        allTimeBest: await getAllTimeTopPlayers(ctx.prisma),
        longestStreak,
        mostRecentGame,
        latestTournamentWinner
      }
    }),
  tournamentsStats: protectedProcedure
    .query(async ({ ctx }) => {
      const tournaments = await ctx.prisma.tournament.findMany({
        include: {
          players: true,
          winner: true
        },
        orderBy: {
          createdAt: 'desc'
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
          isLocked: !(tournamentLocked!.isLocked)
        },
        select: {
          id: true,
          isLocked: true
        }
      })
    })
})
