import { Prisma } from "@prisma/client"
import { GetResult } from "@prisma/client/runtime"
import { TRPCError } from "@trpc/server"

type GameType = {
  round: number
  player1?: string
  player2?: string
}

export const calculateGameSchedule: (players: string[]) => GameType[] = (players) => {
  players = shuffleArray(players)
  const gameSchedule: GameType[] = []
  const n = players.length
  const evenNumberOfPlayers = (n % 2) == 0
  const x = evenNumberOfPlayers ? 1 : 2

  const rounds = (n - 1)
  for (let i = 0; i < rounds; i++) {
    if (i != 0) {
      players.splice(1, 0, players.pop()!)
    }
    for (let j = 0; j < rounds / 2; j++) {
      gameSchedule.push({
        round: i,
        player1: players[j],
        player2: players[n - j - x]
      })
    }
    if (!evenNumberOfPlayers) {
      gameSchedule.push({
        round: i,
        player1: players[n - 1],
        player2: undefined
      })
    }
  }
  return gameSchedule
}

function shuffleArray(array: any[]) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

export const getLeadersFromList: (players: { name: string, score: number }[]) => { first: string, second: string, third: string } = (players) => {
  const first: string[] = []
  const second: string[] = []
  const third: string[] = []

  const playerScores = players.sort((a, b) => b.score - a.score)
  let score = players[0]?.score
  if (!score) {
    return {
      first: '',
      second: '',
      third: '',
    }
  }
  let index = 0
  console.log(playerScores)
  playerScores.forEach(player => {
    if (index < 2) {
      if (player.score < score!) {
        index++
        score = player.score
      }
      if (index == 0) {
        first.push(player.name)
      } else if (index == 1) {
        second.push(player.name)
      } else {
        third.push(player.name)
      }
    }
  })
  let firstPos: string = ''
  let secondPos: string = ''
  let thirdPos: string = ''
  if (first.length == 1) {
    firstPos = first[0]!
  } else {
    firstPos = 'Tied first place: ' + first.join(', ')
  }
  if (second.length == 1) {
    secondPos = first[0]!
  } else {
    secondPos = 'Tied first place: ' + first.join(', ')
  }
  if (third.length == 1) {
    thirdPos = first[0]!
  } else {
    thirdPos = 'Tied first place: ' + first.join(', ')
  }
  return {
    first: firstPos,
    second: secondPos,
    third: thirdPos,
  }
}
type PlayerType = {
  id: string;
  createdAt: Date;
  firstName: string;
  lastName: string;
}

type RatingType = {
  id: string;
  time: Date;
  rating: number;
  userId: string;
  gameId: string;
  player: {
    id: string;
    createdAt: Date;
    firstName: string;
    lastName: string;
  }
}

export const weeksBiggestGainer = (players: PlayerType[], ratings: RatingType[]) => {

  const playerIncreases: { increase: number, name: string }[] = []
  players.forEach(player => {
    const playerRatings = ratings.filter(r => r.player.id == player.id)
    let increase = 0
    if (playerRatings.length == 1) {
      increase = (playerRatings[0]?.rating ?? 1200) - 1200
    } else if (playerRatings.length > 1) {
      const start = playerRatings.sort((a, b) => a.time.getTime() - b.time.getTime())[0]?.rating ?? 1200
      const end = playerRatings.sort((a, b) => b.time.getTime() - a.time.getTime())[0]?.rating ?? 1200
      increase = end - start
    }
    playerIncreases.push({
      increase,
      name: `${player.firstName} ${player.lastName}`
    })
  })
  console.log(playerIncreases)
  const biggestGainer = playerIncreases.sort((a, b) => b.increase - a.increase)[0]
  return biggestGainer ?? {
    name: '',
    increase: 0
  }
}