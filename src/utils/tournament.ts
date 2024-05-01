import { Game, PrismaClient, Rating, User } from "@prisma/client";
import { MarkerType, Node } from "reactflow";
import { v4 as uuidv4 } from 'uuid'
import { GameWithPlayers, MinimalGame, RatingWithPlayer } from "~/types";

const kFactor = 25

export const roundRobinScheduleGames: (players: string[]) => {
  schedule: MinimalGame[],
  numRounds: number
} = (players) => {

  players = shuffleArray(players)
  if (players.length % 2 != 0) {
    players.push('')
  }
  const n = players.length
  const gameSchedule: MinimalGame[] = []

  const rounds = (n - 1)
  for (let i = 0; i < rounds; i++) {
    if (i != 0) {
      players.splice(1, 0, players.pop()!)
    }
    for (let j = 0; j < rounds / 2; j++) {
      gameSchedule.push({
        poolId: String.fromCharCode(65 + i),
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


export const weeksBiggestGainer = (players: User[], ratings: RatingWithPlayer[]) => {

  const playerIncreases: { increase: number, name: string }[] = []
  players.forEach(player => {
    const playerRatings = ratings.filter(r => r.player.id == player.id)
    let increase = 0
    if (playerRatings.length == 1) {
      increase = (playerRatings.at(0)?.rating ?? 1200) - 1200
    } else if (playerRatings.length > 1) {
      const start = playerRatings.sort((a, b) => a.time.getTime() - b.time.getTime()).at(0)?.rating ?? 1200
      const end = playerRatings.sort((a, b) => b.time.getTime() - a.time.getTime()).at(0)?.rating ?? 1200
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

export const mostGamesUser = (players: User[], games: GameWithPlayers[]) => {
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
    player: `${sortedTotalGames.at(0)?.name ?? ''}`,
    value: sortedTotalGames.at(0)?.totalGames ?? 0
  }
}

export const playerRatingHistories = (players: User[], ratings: RatingWithPlayer[]) => {
  const historiesMap: { [key: string]: { name: string, history: number[], current: number, avatar: string } } = {}
  players.forEach(player => {
    const playerHistory = ratings.filter(ranking => ranking.userId == player.id).sort((a, b) => a.time.getTime() - b.time.getTime())
    historiesMap[player.id] = {
      name: player.name,
      history: playerHistory.map(h => h.rating),
      current: playerHistory[playerHistory.length - 1]?.rating ?? 0,
      avatar: player.avatar
    }
  })
  return Object.values(historiesMap).sort((a, b) => b.current - a.current)
}

export const getAllTimeTopPlayers = async (prisma: PrismaClient) => {
  const ratings = await prisma.rating.findMany()
  const groupedRatings = ratings.reduce((acc, rating) => {
    if (!(rating.userId in acc)) {
      acc[rating.userId] = []
    }
    acc[rating.userId].push(rating)
    return acc
  }, {} as { [key: string]: Rating[] })
  Object.keys(groupedRatings).forEach(key => {
    groupedRatings[key].sort((ratingA, ratingB) => ratingB.time.getTime() - ratingA.time.getTime())
  })
  const sortedRatings = Object.values(groupedRatings).sort((listA, listB) => listB.at(0).rating - listA.at(0).rating)
  const topRatedPlayers = []
  const users = await prisma.user.findMany()
  for (let i = 0; i < 5; i++) {
    const ratingsGroup = sortedRatings.at(i)
    const rating = ratingsGroup.at(0)
    if (!rating) break
    const user = users.find(u => u.id == rating.userId)
    topRatedPlayers.push({
      name: user.name,
      avatar: user.avatar,
      rating: rating.rating,
    })
  }
  return topRatedPlayers
}

function calculateExpectedOutcome(playerRatingA: number, playerRatingB: number) {
  return 1 / (1 + Math.pow(10, (playerRatingB - playerRatingA) / 400))
}

export const calculateNewRatings = (player1Rating: number, player2Rating: number, player1Wins: boolean) => {

  const player1WinProb = calculateExpectedOutcome(player1Rating, player2Rating)
  const player2WinProb = 1 - player1WinProb
  const outcome = player1Wins ? 1 : 0
  const player1RatingChange = kFactor * (outcome - player1WinProb)
  const player2RatingChange = kFactor * ((1 - outcome) - player2WinProb)
  const player1NewRating = player1Rating + player1RatingChange
  const player2NewRating = player2Rating + player2RatingChange
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

const getGroupSize = (totalPlayers: number) => {
  const groupSizes: { [key: number]: { ratio: number, groupSize: number } } = {}
  for (let groupSize = 2; groupSize < totalPlayers; groupSize++) {
    const remainder = totalPlayers % groupSize
    groupSizes[groupSize] = {
      groupSize,
      ratio: (1 + remainder * Math.pow(remainder, 2)) + (0.2 * (1 + Math.abs(groupSize - 4)))
    }
  }
  const sizes = Object.values(groupSizes).sort((a, b) => a.ratio - b.ratio)
  return sizes.at(0)?.groupSize ?? 4
}

export const scheduleMultiStageGames = (players: string[]) => {
  const matches: Game[] = []
  const totalPlayers = players.length
  const groupSize = getGroupSize(totalPlayers)
  const baseGroup = 'A'

  for (let group = 0; (group + 1) * groupSize <= totalPlayers; group++) {
    let roundPlayers = players.slice(groupSize * group, groupSize * (group + 1))
    if ((group + 2) * groupSize > totalPlayers) {
      roundPlayers = players.slice(groupSize * group)
    }
    const { schedule } = roundRobinScheduleGames(roundPlayers)
    schedule.filter(g => g.player1Id && g.player2Id).forEach(game => {
      matches.push({
        id: uuidv4(),
        type: 'group',
        tournamentId: '',
        poolId: String.fromCharCode(baseGroup.charCodeAt(0) + group),
        player1Id: game.player1Id,
        player2Id: game.player2Id,
        time: new Date(),
        player1Points: 0,
        player2Points: 0,
        nextRoundId: undefined,
        round: undefined,
        level: undefined
      })
    })
  }

  const numPlayersThatProgress = Math.pow(2, Math.floor(Math.log2(totalPlayers)))

  let currentRound = []
  for (let level = 0; level < Math.log2(numPlayersThatProgress); level++) {
    const prevRound = currentRound
    currentRound = []
    const numRoundGames = numPlayersThatProgress / Math.pow(2, level + 1)
    for (let gameNum = 0; gameNum < numRoundGames; gameNum++) {
      const id = uuidv4()
      currentRound.push({
        id: id,
        type: 'knockout',
        tournamentId: '',
        level,
        round: level,
        time: new Date(),
        poolId: undefined,
        player1Id: undefined,
        player2Id: undefined,
        player1Points: 0,
        player2Points: 0,
        nextRoundId: undefined,
      })
      if (level != 0) {
        const match1 = prevRound.pop()
        const match2 = prevRound.pop()
        match1.nextRoundId = id
        match2.nextRoundId = id
        matches.push(match1)
        matches.push(match2)
      }
    }
  }
  matches.push(currentRound.pop())

  const numRounds = Math.log2(numPlayersThatProgress)

  return { gameSchedule: matches, numRounds }
}

export const calculatedNodePositions = (topLeft: coordinate, botRight: coordinate, games: Game[]) => {
  const nodes: Node[] = []
  const edges: { id: string, source: string, target: string, type: string, markerEnd?: { type: MarkerType } }[] = []
  const height = botRight.y - topLeft.y
  const width = botRight.x - topLeft.x
  const numLevel0Games = games.filter(g => g.level == 0).length
  const numStages = Math.max(...games.map(g => g.level)) + 1
  const yDiffBase = height / numLevel0Games
  const xDiff = width / numStages
  const twoDGamesArray = []
  for (let i = 0; i < numStages; i++) {
    const stageGames = games
      .filter(game => game.level == i)
      .sort((gameA, gameB) => {
        if (i > 0) {
          const AParentsMinYIndex = Math.min(...twoDGamesArray[i - 1]
            .filter(node => node.nextRoundId == gameA.id)
            .map(node => twoDGamesArray[i - 1].indexOf(node))
          )
          const BParentsMinYIndex = Math.min(...twoDGamesArray[i - 1]
            .filter(node => node.nextRoundId == gameB.id)
            .map(node => twoDGamesArray[i - 1].indexOf(node))
          )
          return AParentsMinYIndex - BParentsMinYIndex
        } else {
          return 1
        }
      })
    twoDGamesArray.push(stageGames)
  }

  twoDGamesArray.forEach((stage: Game[], i) => {
    const yDiff = yDiffBase * Math.pow(2, i)
    const yBase = (Math.pow(2, i) - 1) * (yDiffBase / 2)
    const xBase = i * xDiff
    stage.forEach((game: Game, j) => {
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

  twoDGamesArray.forEach((stages: Game[], i) => {
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

export const calcKnockoutGames = (games: GameWithPlayers[]) => {
  const players = games.reduce((acc, curr) => {
    return {
      ...acc,
      [curr.player1Id]: curr.player1.name,
      [curr.player2Id]: curr.player2.name
    }
  }, {})
  return players
}
