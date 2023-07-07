import { createServer } from 'http'
import { parse } from 'url'
import next from 'next'
import { PrismaClient } from "@prisma/client";
import { roundRobinScheduleGames } from '../utils/tournament'

const prisma = new PrismaClient()
const port = parseInt(process.env.PORT || '3000', 10)
const dev = process.env.NODE_ENV !== 'production'
const app = next({ dev })
const handle = app.getRequestHandler()

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

app.prepare().then(() => {
  void setInterval(() => {
    console.log('Starting tournaments')
    void startTournaments()
  }, 1000 * 60 * 60)
  createServer((req, res) => {
    const parsedUrl = parse(req.url, true)
    void handle(req, res, parsedUrl)
  }).listen(port)

  console.log(
    `> Server listening at http://localhost:${port} as ${dev ? 'development' : process.env.NODE_ENV}`
  )
}).catch(err => {
  console.log('Error starting server')
})