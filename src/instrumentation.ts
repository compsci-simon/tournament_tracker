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
          create: schedule.map(s => {
            return ({
              players: {
                connect: s.player2 ? [({ id: s.player1 }), ({ id: s.player2 })] : [({ id: s.player1 })]
              },
              player1Id: s.player1,
              player2Id: s.player2 ?? '',
              round: s.round
            })
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
            return ({
              players: {
                connect: game.type == 'group' ?
                  (
                    game.player2 ? [({ id: game.player1 }), ({ id: game.player2 })] : [({ id: game.player1 })]
                  )
                  : []
              },
              player1Id: game.player1 ?? '',
              player2Id: game.player2 ?? '',
              round: game.round,
              type: game.type,
              group: game.group
            })
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