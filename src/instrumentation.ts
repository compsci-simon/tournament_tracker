import assert from "assert"
import { prisma } from "./server/db"
import { roundRobinScheduleGames, scheduleMultiStageGames } from "./utils/tournament"
import { getServerSettings, ServerSettings } from "./utils/utils"
import { Game, Rating } from "@prisma/client"

type ConnectType = { connect: { id: string } }
type NewGame = { userGame?: { create: any[] }, player1?: ConnectType, player2?: ConnectType }

const startTournament = async (tournamentId: string) => {
  const tournament = await prisma.tournament.findFirst({
    where: {
      id: tournamentId
    },
    include: {
      players: true
    }
  })
  assert(tournament)
  if (tournament.type == 'round-robbin') {
    const { schedule, numRounds } = roundRobinScheduleGames(tournament.players.map(p => p.id))

    return await prisma.tournament.update({
      where: {
        id: tournamentId
      },
      data: {
        games: {
          create: schedule.map(game => {
            const gameToReturn: NewGame = {
              userGame: {
                create: []
              },
            }
            if (game.player1Id) {
              gameToReturn.player1 = {
                connect: {
                  id: game.player1Id
                }
              }
              gameToReturn.userGame!.create.push(({ userId: game.player1Id }))
            }
            if (game.player2Id) {
              gameToReturn.player2 = {
                connect: {
                  id: game.player2Id
                }
              }
              gameToReturn.userGame!.create.push(({ userId: game.player2Id }))
            }
            return gameToReturn
          })
        },
        numRounds
      }
    })
  } else if (tournament.type == 'multi-stage') {
    const { gameSchedule, numRounds } = scheduleMultiStageGames(tournament.players.map(p => p.id))

    const data = {
      games: {
        create: gameSchedule.map(game => {
          const newGame: Omit<Game & NewGame, 'tournamentId' | 'player1Id' | 'player2Id' | 'userId'> & Partial<Pick<Game, 'tournamentId' | 'player1Id' | 'player2Id' | 'userId'>> = game
          newGame.userGame = {
            create: []
          }
          if (newGame.player1Id) {
            newGame.player1 = {
              connect: {
                id: newGame.player1Id
              }
            }
            newGame.userGame.create.push(({ userId: game.player1Id }))
          }
          if (newGame.player2Id) {
            newGame.player2 = {
              connect: {
                id: newGame.player2Id
              }
            }
            newGame.userGame.create.push(({ userId: game.player2Id }))
          }
          delete newGame.tournamentId
          delete newGame.player1Id
          delete newGame.player2Id
          delete newGame.userId
          return newGame
        })
      },
      numRounds
    }

    return await prisma.tournament.update({
      where: {
        id: tournamentId,
      },
      data
    })
  } else {
    throw new Error(`Unknown tournament type: ${tournament.type}`);
  }
}

const startTournaments = async () => {
  const jobs = await prisma.tournamentJob.findMany({
    include: {
      tournament: true,
    }
  })
  const currentDateTime = new Date()
  void jobs.forEach((job) => {
    if (job.tournament.startDate <= currentDateTime) {
      startTournament(job.tournamentId)
        .then(() => {
          void prisma.tournamentJob.delete({
            where: {
              id: job.id
            }
          })
            .then(() => {
              console.log('deleted tournament job')
            })
            .catch(err => console.error(err))
        })
        .catch(err => console.error(err))
    }
  })
}

const DayMilliseconds = 86400000

const shouldDecay = (rating: Rating, serverSettings: ServerSettings) => {
  if (rating.rating < serverSettings.decay.decayThreshold) return false
  const now = new Date()
  if (serverSettings.decay.decayInterval.unit == 'month') {
    const monthDiffValid = now.getMonth() - rating.time.getMonth() > serverSettings.decay.decayInterval.quantity
    const sameDayOfMonth = now.getDay() - rating.time.getDay() == 0
    return monthDiffValid && sameDayOfMonth
  } else if (serverSettings.decay.decayInterval.unit == 'day') {
    const dayDiff = Math.floor((now.getTime() - rating.time.getTime()) / DayMilliseconds)
    return dayDiff % serverSettings.decay.decayInterval.quantity == 0 && dayDiff > 0
  } else {
    const unit: never = serverSettings.decay.decayInterval.unit
    throw Error(`Unrecognized decay unit: ${unit as string}`)
  }
}

const eloDecay = async () => {
  console.log('Running elo decay')
  const users = await prisma.user.findMany({ select: { id: true } })
  const serverSettings = getServerSettings()
  for (const user of users) {
    const lastRating = await prisma.rating.findFirst({ where: { userId: user.id }, orderBy: { time: 'desc' } })
    assert(lastRating)
    if (shouldDecay(lastRating, serverSettings)) {
      await prisma.rating.create({
        data: {
          rating: lastRating.rating - serverSettings.decay.decayAmount,
          ratingChange: serverSettings.decay.decayAmount,
          player: { connect: { id: user.id } },
          cause: 'decay'
        }
      })
    }
  }
}

/**
 * The register function that is exported from instrumentation.ts is a special function that is run when nextJS starts. This allows us to register chronjobs by means of `setInterval` when the server start.
 */
export const register = () => {
  void startTournaments()
  void eloDecay()
  setInterval(() => {
    void startTournaments()
    void eloDecay()
  }, DayMilliseconds)
}