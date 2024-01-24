import { prisma } from "./server/db"
import { roundRobinScheduleGames, scheduleMultiStageGames } from "./utils/tournament"

const startTournament = async (tournamentId: string) => {
  const tournament = await prisma.tournament.findFirst({
    where: {
      id: tournamentId
    },
    include: {
      players: true
    }
  })
  if (tournament.type == 'round-robbin') {
    const { schedule, numRounds } = roundRobinScheduleGames(tournament.players.map(p => p.id))

    return await prisma.tournament.update({
      where: {
        id: tournamentId
      },
      data: {
        games: {
          create: schedule.map(game => {
            const gameToReturn: { [key: string]: any } = {
              userGame: {
                create: []
              },
              round: game.round
            }
            if (game.player1Id) {
              gameToReturn.player1 = {
                connect: {
                  id: game.player1Id
                }
              }
              gameToReturn.userGame.create.push(({ userId: game.player1Id }))
            }
            if (game.player2Id) {
              gameToReturn.player2 = {
                connect: {
                  id: game.player2Id
                }
              }
              gameToReturn.userGame.create.push(({ userId: game.player2Id }))
            }
            return gameToReturn
          })
        },
        numRounds
      }
    })
  } else if (tournament.type == 'multi-stage') {
    const { gameSchedule, numRounds } = scheduleMultiStageGames(tournament.players.map(p => p.id))

    return await prisma.tournament.update({
      where: {
        id: tournamentId,
      },
      data: {
        games: {
          create: gameSchedule.map(game => {
            const newGame: { [key: string]: any } = game
            delete newGame.tournamentId
            newGame.userGame = {
              create: []
            }
            if (game.player1Id) {
              newGame.player1 = {
                connect: {
                  id: game.player1Id
                }
              }
              newGame.userGame.create.push(({ userId: game.player1Id }))
            }
            delete newGame.player1Id
            if (game.player2Id) {
              newGame.player2 = {
                connect: {
                  id: game.player2Id
                }
              }
              newGame.userGame.create.push(({ userId: game.player2Id }))
            }
            delete newGame.player2Id
            return newGame
          })
        },
        numRounds
      }
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
      startTournament(job.tournamentId).then(() => {
        void prisma.tournamentJob.delete({
          where: {
            id: job.id
          }
        }).then(() => {
          console.log('deleted tournament job')
        }).catch(err => console.error(err))
      }).catch(err => console.error(err))
    }
  })
}

export const register = () => {
  void startTournaments()
  setInterval(() => {
    void startTournaments()
  }, 1000 * 60 * 60)
}