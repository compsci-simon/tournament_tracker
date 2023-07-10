import { prisma } from "./server/db"
import { roundRobinScheduleGames } from "./utils/tournament"

const startTournament = async (tournamentId: string) => {
  const tournament = await prisma.tournament.findFirst({
    where: {
      id: tournamentId
    },
    include: {
      players: true
    }
  })
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
              connect: [({ id: s.player1 }), ({ id: s.player2 })]
            },
            player1Id: s.player1,
            player2Id: s.player2,
            round: s.round
          })
        })
      },
      numRounds
    }
  })
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
      void startTournament(job.tournamentId).then(() => {
        void prisma.tournamentJob.delete({
          where: {
            id: job.id
          }
        })
      })
    }
  })
}

export const register = () => {
  setInterval(() => {
    startTournaments()
  }, 1000 * 60 * 60)
}