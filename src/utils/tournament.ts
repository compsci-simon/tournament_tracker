import { MarkerType } from "reactflow";

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

type GameType = {
  player1Points: number
  player2Points: number
  players: PlayerType[]
}

type GameScheduleType = {
  round: number
  player1?: string
  player2?: string
}

const kFactor = 25

export const roundRobinScheduleGames: (players: string[]) => { schedule: GameScheduleType[], numRounds: number } = (players) => {
  players = shuffleArray(players)
  const gameSchedule: GameScheduleType[] = []
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
  return { schedule: gameSchedule, numRounds: rounds }
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
    if (game.players.length == 2
      && (game.player1Points > 0 || game.player2Points > 0)) {

      game.players.forEach(player => {
        totalGames[player.id]!.totalGames += 1
      })
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
  players: string[]
}

interface extendedStage extends stage {
  x: number
  y: number
  id: string
}


export const scheduleMultiStageGames = (players: { id: string, name: string }[]) => {
  if (players.length > 8) {

  }
}


export const calculatedNodePositions = (topLeft: coordinate, botRight: coordinate, stages: { [key: number]: stage }) => {
  let lastStage = 0
  const nodes: extendedStage[] = []
  const edges: { id: string, source: string, target: string, type: string, markerEnd?: { type: MarkerType } }[] = []
  const stagesArray = Object.values(stages)
  let x = topLeft.x
  let sourceNode = 0
  let id = 0

  stagesArray.forEach(s => {
    if (s.level > lastStage) {
      lastStage = s.level
    }
  })

  const xdiff = (botRight.x - topLeft.x) / (lastStage + 1)
  const level0NodesLen = stagesArray.filter(s => s.level == 0).length
  const yIncrement = (botRight.y - topLeft.y) / level0NodesLen

  for (let i = 0; i < lastStage + 1; i++) {
    const levelNodes = stagesArray.filter(s => s.level == i)
    const ydiff = (botRight.y - topLeft.y) / levelNodes.length
    let y = topLeft.y + i * yIncrement - (i > 0 ? yIncrement / 2 : 0)

    levelNodes.forEach(s => {
      nodes.push({ ...s, x, y, id: `${id}` })
      if (i > 0) {
        edges.push({ id: `edge-${sourceNode}`, source: `${sourceNode}`, target: `${id}`, type: 'smoothstep', markerEnd: { type: MarkerType.Arrow } })
        edges.push({ id: `edge-${sourceNode + 1}`, source: `${sourceNode + 1}`, target: `${id}`, type: 'smoothstep', markerEnd: { type: MarkerType.Arrow } })
        sourceNode += 2
      }
      id++
      y += ydiff
    })
    x += xdiff
  }
  return { nodes, edges }
}
