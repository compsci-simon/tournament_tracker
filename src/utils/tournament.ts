import { MarkerType, Node } from "reactflow";
import { RouterOutputs } from "~/server/api/trpc";
import { GameType } from "~/type";
import { v4 as uuidv4 } from 'uuid'

type PlayerType = {
  id: string;
  createdAt: Date;
  name: string;
  avatar: string;
}

type RatingType = {
  id: string;
  time: Date;
  rating: number;
  userId: string;
  gameId: string | null;
  player: {
    id: string;
    createdAt: Date;
    name: string;
  }
}

type GamesType = RouterOutputs['tournament']['getTournament']['games']

type GameScheduleType = {
  round: number
  player1Id: string
  player2Id: string
}

const kFactor = 25

export const roundRobinScheduleGames: (players: string[]) => {
  schedule: GameScheduleType[],
  numRounds: number
} = (players) => {

  players = shuffleArray(players)
  if (players.length % 2 != 0) {
    players.push('')
  }
  const n = players.length
  const gameSchedule: GameScheduleType[] = []

  const rounds = (n - 1)
  for (let i = 0; i < rounds; i++) {
    if (i != 0) {
      players.splice(1, 0, players.pop()!)
    }
    for (let j = 0; j < rounds / 2; j++) {
      gameSchedule.push({
        round: i,
        player1Id: players[j],
        player2Id: players[n - j - 1]
      })
    }
  }

  return {
    schedule: gameSchedule.map(game => {
      if (game.player1Id == '') {
        return {
          ...game,
          player1Id: game.player2Id,
          player2Id: ''
        }
      } else {
        return game
      }
    }),
    numRounds: rounds
  }
}

function shuffleArray(array: string[]) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    if (array[i] && array[j]) {
      const temp = array[i]
      array[i] == array[j]
      array[j] == temp
    }
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
  playerScores.forEach(player => {
    if (index < 2) {
      if (player.score < score) {
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
  let firstPos = ''
  let secondPos = ''
  let thirdPos = ''
  if (first.length == 1) {
    firstPos = first[0]!
  } else if (first.length > 1) {
    firstPos = 'Tied: ' + first.join(', ')
  }
  if (second.length == 1) {
    secondPos = second[0]!
  } else if (second.length > 1) {
    secondPos = 'Tied: ' + second.join(', ')
  }
  if (third.length == 1) {
    thirdPos = third[0]!
  } else if (third.length > 1) {
    thirdPos = 'Tied: ' + third.join(', ')
  }
  return {
    first: firstPos,
    second: secondPos,
    third: thirdPos,
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
      name: player.name
    })
  })
  const biggestGainer = playerIncreases.sort((a, b) => b.increase - a.increase)[0]
  return biggestGainer ?? {
    name: '',
    increase: 0
  }
}

export const numPlayedGames = (games: GameType[]) => {
  return games.filter(g => { return g.player1Points > 0 || g.player2Points > 0 }).length
}

export const mostGamesUser = (players: PlayerType[], games: GameType[]) => {
  const totalGames: { [key: string]: { name: string, totalGames: number } } = {}

  players.forEach(player => {
    totalGames[player.id] = {
      name: player.name,
      totalGames: 0
    }
  })
  games.forEach(game => {
    if (game.player1
      && (game.player1Points > 0 || game.player2Points > 0)) {

      totalGames[game.player1.id].totalGames += 1
      totalGames[game.player2.id].totalGames += 1
    }
  })

  const totalGamesArray = Object.values(totalGames)
  const sortedTotalGames = totalGamesArray.sort((a, b) => b.totalGames - a.totalGames)

  return {
    player: `${sortedTotalGames[0]?.name ?? ''}`,
    value: sortedTotalGames[0]?.totalGames ?? 0
  }
}

export const playerRankingHistories = (players: PlayerType[], rankings: RatingType[]) => {
  const historiesMap: { [key: string]: { name: string, history: number[], current: number, avatar: string } } = {}
  players.forEach(player => {
    const playerHistory = rankings.filter(ranking => ranking.userId == player.id).sort((a, b) => a.time.getTime() - b.time.getTime())
    historiesMap[player.id] = {
      name: player.name,
      history: playerHistory.map(h => h.rating),
      current: playerHistory[playerHistory.length - 1]?.rating ?? 0,
      avatar: player.avatar
    }
  })
  return Object.values(historiesMap).sort((a, b) => b.current - a.current)
}

function calculateExpectedOutcome(playerRatingA: number, playerRatingB: number) {
  return 1 / (1 + Math.pow(10, (playerRatingB - playerRatingA) / 400))
}

export const calculateNewRatings = (player1Rating: number, player2Rating: number, player1Wins: boolean) => {

  const expectedOutcome1 = calculateExpectedOutcome(player1Rating, player2Rating)
  const expectedOutcome2 = 1 - expectedOutcome1
  const outcome = player1Wins ? 1 : 0
  const player1RatingChange = kFactor * (outcome - expectedOutcome1)
  const player2RatingChange = kFactor * ((1 - outcome) - expectedOutcome2)
  const player1NewRating = (player1Rating) + player1RatingChange
  const player2NewRating = (player2Rating) + player2RatingChange
  return {
    player1NewRating,
    player2NewRating,
    player1RatingChange,
    player2RatingChange,
  }
}

type coordinate = {
  x: number
  y: number
}

interface stage {
  level: number
  player1Id: string
  player2Id: string
  id: string
}

const getGroupSize = (totalPlayers: number) => {
  const groupSizes: { [key: number]: { ratio: number, groupSize: number } } = {}
  for (let groupSize = 2; groupSize <= totalPlayers; groupSize++) {
    const numGroups = Math.ceil(totalPlayers / groupSize)
    const avgPlayers = totalPlayers * 1.0 / numGroups
    const remainder = totalPlayers % groupSize
    let variance = Math.pow(groupSize - avgPlayers, 2) * numGroups + (remainder != 0 ? Math.pow(remainder - avgPlayers, 2) : 0)
    groupSizes[groupSize] = {
      groupSize,
      ratio: 2 * variance + Math.pow(groupSize - 4, 2) + Math.min(0, groupSize - 4) * -2
    }
  }
  const sizes = Object.values(groupSizes).sort((a, b) => a.ratio - b.ratio)
  return sizes[0].groupSize ?? 4
}

function closestPowerOf2LessThan(number: number) {
  let powerOf2 = 1;

  while (powerOf2 * 2 < number) {
    powerOf2 *= 2;
  }

  return powerOf2;
}

export const scheduleMultiStageGames = (players: string[]) => {
  const matches: { type: string, group?: string, level?: number, player1Id?: string, player2Id?: string, round: number }[] = []
  const totalPlayers = players.length
  const groupSize = getGroupSize(totalPlayers)
  const baseGroup = 'A'

  for (let group = 0; group < Math.ceil(totalPlayers * 1.0 / groupSize); group++) {
    const roundPlayers = players.slice(4 * group, 4 * (group + 1))
    const { schedule } = roundRobinScheduleGames(roundPlayers)
    schedule.forEach(game => {
      matches.push({
        type: 'group',
        group: String.fromCharCode(baseGroup.charCodeAt(0) + group),
        player1Id: game.player1Id,
        player2Id: game.player2Id,
        round: game.round
      })
    })
  }

  const numPlayersThatProgress = closestPowerOf2LessThan(totalPlayers)

  for (let i = numPlayersThatProgress, level = 0; i > 1; i /= 2, level++) {
    for (let j = 0; j < i / 2; j++) {
      matches.push({ type: 'knockout', level, round: groupSize + level, player1Id: null, player2Id: null })
    }
  }

  const numRounds = groupSize - 1 + Math.log2(numPlayersThatProgress) - 1

  return { gameSchedule: matches, numRounds }
}

export const calculatedNodePositions = (topLeft: coordinate, botRight: coordinate, games: GameType[]) => {
  const nodes: Node[] = []
  const edges: { id: string, source: string, target: string, type: string, markerEnd?: { type: MarkerType } }[] = []
  const height = botRight.y - topLeft.y
  const width = botRight.x - topLeft.x
  const numLevel0Games = games.filter(g => g.level == 0).length
  const numStages = Math.max(...games.map(g => g.level)) + 1
  const yDiff = height / numLevel0Games
  const xDiff = width / numStages
  const twoDGamesArray = []
  for (let i = 0; i < numStages; i++) {
    twoDGamesArray.push(games.filter(g => g.level == i).sort((a, b) => a.id - b.ids))
  }

  twoDGamesArray.forEach((stage: GameType[], i) => {
    const yBase = i * (yDiff / 2)
    const xBase = i * xDiff
    stage.forEach((game: GameType, j) => {
      const newNode: Node = {
        id: game.id,
        position: {
          x: xBase,
          y: yBase + j * yDiff
        },
        data: game,
        type: 'knockoutNode'
      }
      nodes.push(newNode)
    })
  })

  twoDGamesArray.forEach((stages: GameType[], i) => {
    if (i == 0) return;
    stages.forEach((game, j) => {
      const newEdge1 = {
        id: uuidv4(),
        source: twoDGamesArray[i - 1][j * 2].id,
        target: twoDGamesArray[i][j].id,
        type: 'smoothstep',
        markerEnd: {
          type: MarkerType.Arrow
        }
      }
      const newEdge2 = {
        id: uuidv4(),
        source: twoDGamesArray[i - 1][j * 2 + 1].id,
        target: twoDGamesArray[i][j].id,
        type: 'smoothstep',
        markerEnd: {
          type: MarkerType.Arrow
        }
      }
      edges.push(newEdge1)
      edges.push(newEdge2)
    })
  })

  return { nodes, edges }
}

export const calcKnockoutGames = (games: GamesType) => {
  const players = games.reduce((acc, curr) => {
    return {
      ...acc,
      [curr.player1Id]: curr.player1.name,
      [curr.player2Id]: curr.player2.name
    }
  }, {})
  return players
}