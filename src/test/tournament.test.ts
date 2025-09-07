import { expect, test, describe } from '@jest/globals';

import { 
  scheduleMultiStageGames, 
  roundRobinScheduleGames, 
  calculateNewRatings,
  getLeadersFromList,
  calculatedNodePositions,
  getGroupSize
} from "../utils/tournament";

const players = ['simon', 'ben', 'lienke', 'liv', 'james', 'lisa', 'shailen', 'paul']

describe('test scheduling functions', () => {

  test('Test scheduling results in a good split of pools', () => {
    const { gameSchedule, numRounds } = scheduleMultiStageGames(players)
    expect(numRounds).toBe(3)
    expect(gameSchedule.length).toBe(19)
    expect(gameSchedule.filter(g => g.type == 'knockout').length).toBe(7)
    expect(gameSchedule.filter(g => g.type == 'knockout' && g.level == 0).length).toBe(4)
    expect(gameSchedule.filter(g => g.type == 'knockout' && g.level == 1).length).toBe(2)
    expect(gameSchedule.filter(g => g.type == 'knockout' && g.level == 2).length).toBe(1)
  })

  test('Test multi-stage tournament with different player counts', () => {
    // Test with odd number of players
    const oddPlayers = ['alice', 'bob', 'charlie', 'david', 'eve']
    const { gameSchedule: oddSchedule } = scheduleMultiStageGames(oddPlayers)
    
    // Should still create proper knockout bracket (4 players advance)
    expect(oddSchedule.filter(g => g.type == 'knockout').length).toBe(3) // 2+1 knockout games
    
    // Test with perfect power of 2
    const powerOf2Players = ['a', 'b', 'c', 'd']
    const { gameSchedule: powerSchedule } = scheduleMultiStageGames(powerOf2Players)
    expect(powerSchedule.filter(g => g.type == 'knockout').length).toBe(3) // 2+1 knockout games
  })

})

describe('round-robin scheduling', () => {

  test('Round-robin creates correct number of games', () => {
    const testPlayers = ['alice', 'bob', 'charlie', 'david']
    const { schedule, numRounds } = roundRobinScheduleGames(testPlayers)
    
    // 4 players = 3 rounds, 6 total games (each player plays each other once)
    expect(numRounds).toBe(3)
    expect(schedule.length).toBe(6)
    
    // Verify each player appears correct number of times
    const playerCounts = testPlayers.reduce((acc, player) => {
      acc[player] = schedule.filter(game => 
        game.player1Id === player || game.player2Id === player
      ).length
      return acc
    }, {} as Record<string, number>)
    
    // Each player should play exactly 3 games (against each other player)
    Object.values(playerCounts).forEach(count => expect(count).toBe(3))
  })

  test('Round-robin handles odd number of players with byes', () => {
    const oddPlayers = ['alice', 'bob', 'charlie']
    const { schedule, numRounds } = roundRobinScheduleGames(oddPlayers)
    
    // 3 players + 1 bye = 4 total, so 3 rounds
    expect(numRounds).toBe(3)
    expect(schedule.length).toBe(6)
    
    // Should have games with empty player2Id (byes)
    const byeGames = schedule.filter(game => game.player2Id === '')
    expect(byeGames.length).toBe(3) // Each player gets one bye
    
    // All bye games should have real player in player1Id
    byeGames.forEach(game => {
      expect(game.player1Id).not.toBe('')
      expect(oddPlayers).toContain(game.player1Id)
    })
  })

  test('Round-robin produces unique matchups', () => {
    const players = ['alice', 'bob', 'charlie', 'david', 'eve']
    const { schedule } = roundRobinScheduleGames(players)
    
    // Create set of unique matchups (normalized order)
    const matchups = new Set(
      schedule
        .filter(game => game.player2Id !== '') // Exclude bye games
        .map(game => {
          const [p1, p2] = [game.player1Id, game.player2Id].sort()
          return `${p1}-${p2}`
        })
    )
    
    // Should have exactly C(5,2) = 10 unique matchups
    expect(matchups.size).toBe(10)
  })

})

describe('ELO rating calculations', () => {

  test('Higher rated player beating lower rated player gets fewer points', () => {
    const { player1NewRating, player2NewRating } = calculateNewRatings(1600, 1400, true)
    
    // Player 1 (1600) beats Player 2 (1400)
    expect(player1NewRating).toBeGreaterThan(1600)
    expect(player2NewRating).toBeLessThan(1400)
    
    // Rating changes should be relatively small (expected outcome)
    expect(player1NewRating - 1600).toBeLessThan(15)
    expect(1400 - player2NewRating).toBeLessThan(15)
  })

  test('Lower rated player beating higher rated player gets more points', () => {
    const { player1NewRating, player2NewRating } = calculateNewRatings(1400, 1600, true)
    
    // Player 1 (1400) beats Player 2 (1600) - upset!
    expect(player1NewRating).toBeGreaterThan(1400)
    expect(player2NewRating).toBeLessThan(1600)
    
    // Rating changes should be large (unexpected outcome)
    expect(player1NewRating - 1400).toBeGreaterThan(15)
    expect(1600 - player2NewRating).toBeGreaterThan(15)
  })

  test('Equal rated players exchange equal points', () => {
    const { player1NewRating, player2NewRating } = calculateNewRatings(1500, 1500, true)
    
    // Equal ratings, Player 1 wins
    expect(player1NewRating).toBeGreaterThan(1500)
    expect(player2NewRating).toBeLessThan(1500)
    
    // Rating changes should be equal and opposite
    const player1Change = player1NewRating - 1500
    const player2Change = 1500 - player2NewRating
    expect(Math.abs(player1Change - player2Change)).toBeLessThan(0.01)
  })

  test('Rating conservation principle', () => {
    const initialRating1 = 1600
    const initialRating2 = 1400
    const { player1NewRating, player2NewRating } = calculateNewRatings(initialRating1, initialRating2, true)
    
    // Total rating points should be conserved
    const initialTotal = initialRating1 + initialRating2
    const finalTotal = player1NewRating + player2NewRating
    expect(Math.abs(initialTotal - finalTotal)).toBeLessThan(0.01)
  })

})

describe('leaderboard calculations', () => {

  test('getLeadersFromList correctly identifies top 3', () => {
    const players = [
      { name: 'alice', score: 100 },
      { name: 'bob', score: 200 },
      { name: 'charlie', score: 150 },
      { name: 'david', score: 50 },
      { name: 'eve', score: 175 }
    ]
    
    const { first, second, third } = getLeadersFromList(players)
    
    expect(first).toBe('bob')    // 200 points
    expect(second).toBe('eve')   // 175 points  
    expect(third).toBe('charlie') // 150 points
  })

  test('getLeadersFromList handles ties correctly', () => {
    const players = [
      { name: 'alice', score: 100 },
      { name: 'bob', score: 200 },
      { name: 'charlie', score: 200 }, // Tied for first
      { name: 'david', score: 150 }
    ]
    
    const { first, second, third } = getLeadersFromList(players)
    
    // Both bob and charlie should be included in first
    expect(first).toContain('bob')
    expect(first).toContain('charlie')
    expect(second).toBe('david')
  })

  test('getLeadersFromList with insufficient players', () => {
    const players = [
      { name: 'alice', score: 100 },
      { name: 'bob', score: 200 }
    ]
    
    const { first, second, third } = getLeadersFromList(players)
    
    expect(first).toBe('bob')
    expect(second).toBe('alice')
    expect(third).toBe('') // No third place
  })

})

describe('2D layout algorithm', () => {

  test('calculatedNodePositions creates correct number of nodes and edges', () => {
    // Mock tournament games for 4-player knockout
    const mockGames = [
      { id: 'game1', level: 0, nextRoundId: 'game3' },
      { id: 'game2', level: 0, nextRoundId: 'game3' },
      { id: 'game3', level: 1, nextRoundId: null }
    ]
    
    const topLeft = { x: 0, y: 0 }
    const botRight = { x: 800, y: 600 }
    
    const { nodes, edges } = calculatedNodePositions(topLeft, botRight, mockGames as any)
    
    expect(nodes).toHaveLength(3) // 3 games = 3 nodes
    expect(edges).toHaveLength(2) // 2 connections (game1->game3, game2->game3)
  })

  test('calculatedNodePositions respects canvas boundaries', () => {
    const mockGames = [
      { id: 'game1', level: 0, nextRoundId: null }
    ]
    
    const topLeft = { x: 100, y: 50 }
    const botRight = { x: 500, y: 300 }
    
    const { nodes } = calculatedNodePositions(topLeft, botRight, mockGames as any)
    
    // Node position should be within canvas bounds
    expect(nodes[0].position.x).toBeGreaterThanOrEqual(topLeft.x)
    expect(nodes[0].position.x).toBeLessThanOrEqual(botRight.x)
    expect(nodes[0].position.y).toBeGreaterThanOrEqual(topLeft.y)
    expect(nodes[0].position.y).toBeLessThanOrEqual(botRight.y)
  })

  test('calculatedNodePositions implements exponential spacing', () => {
    // Mock tournament with multiple levels
    const mockGames = [
      { id: 'game1', level: 0, nextRoundId: 'game5' },
      { id: 'game2', level: 0, nextRoundId: 'game5' },
      { id: 'game3', level: 0, nextRoundId: 'game6' },
      { id: 'game4', level: 0, nextRoundId: 'game6' },
      { id: 'game5', level: 1, nextRoundId: 'game7' },
      { id: 'game6', level: 1, nextRoundId: 'game7' },
      { id: 'game7', level: 2, nextRoundId: null }
    ]
    
    const topLeft = { x: 0, y: 0 }
    const botRight = { x: 900, y: 600 }
    
    const { nodes } = calculatedNodePositions(topLeft, botRight, mockGames as any)
    
    // Group nodes by level
    const level0Nodes = nodes.filter(n => mockGames.find(g => g.id === n.id)?.level === 0)
    const level1Nodes = nodes.filter(n => mockGames.find(g => g.id === n.id)?.level === 1)
    
    // Level 1 should have larger Y spacing than Level 0 (exponential growth)
    if (level1Nodes.length >= 2 && level0Nodes.length >= 2) {
      const level0Spacing = Math.abs(level0Nodes[1].position.y - level0Nodes[0].position.y)
      const level1Spacing = Math.abs(level1Nodes[1].position.y - level1Nodes[0].position.y)
      
      expect(level1Spacing).toBeGreaterThan(level0Spacing)
    }
  })

})

describe('edge cases and error handling', () => {

  test('Empty player array handling', () => {
    expect(() => scheduleMultiStageGames([])).not.toThrow()
    expect(() => roundRobinScheduleGames([])).not.toThrow()
  })

  test('Single player tournament', () => {
    const { gameSchedule } = scheduleMultiStageGames(['alice'])
    expect(gameSchedule.length).toBe(0) // No games possible with 1 player
  })

  test('Two player tournament', () => {
    const { schedule } = roundRobinScheduleGames(['alice', 'bob'])
    expect(schedule.length).toBe(1) // Exactly one game
    expect(schedule[0].player1Id).toBeTruthy()
    expect(schedule[0].player2Id).toBeTruthy()
    expect(schedule[0].player1Id).not.toBe(schedule[0].player2Id)
  })

})

describe('getGroupSize optimization', () => {

  test('Small groups (1-6 players) return appropriate sizes', () => {
    // Edge case: 1 player should return 3 (minimum viable group)
    expect(getGroupSize(1)).toBe(3)
    
    // Small groups should return themselves or minimum of 3
    expect(getGroupSize(2)).toBe(3)
    expect(getGroupSize(3)).toBe(3)
    expect(getGroupSize(4)).toBe(4)
    expect(getGroupSize(5)).toBe(5)
    expect(getGroupSize(6)).toBe(6)
  })

  test('Prefers group sizes close to 4 for larger groups', () => {
    // 7 players: groups of 4 would leave 3 remainder, groups of 3 would be 2+1
    expect(getGroupSize(7)).toBe(4) // 1 group of 4, 1 group of 3
    
    // 8 players: perfect for groups of 4
    expect(getGroupSize(8)).toBe(4) // 2 groups of 4
    
    // 9 players: groups of 3 create even distribution (3 groups of 3)
    expect(getGroupSize(9)).toBe(3) // 3 groups of 3
    
    // 10 players: groups of 5 create even distribution (2 groups of 5)
    expect(getGroupSize(10)).toBe(5) // 2 groups of 5
  })

  test('Optimizes for balanced group distribution', () => {
    // 12 players: multiple viable options (3,4,6) - should prefer 4
    expect(getGroupSize(12)).toBe(4) // 3 groups of 4 (perfect balance)
    
    // 15 players: groups of 3 or 5 work well
    expect(getGroupSize(15)).toBe(3) // 5 groups of 3 (perfect balance)
    
    // 16 players: groups of 4 are optimal
    expect(getGroupSize(16)).toBe(4) // 4 groups of 4 (perfect balance)
  })

  test('Handles larger tournaments effectively', () => {
    // 20 players: groups of 4 or 5 work well
    expect(getGroupSize(20)).toBe(4) // 5 groups of 4 (perfect balance)
    
    // 24 players: multiple good options, should prefer close to 4
    expect(getGroupSize(24)).toBe(4) // 6 groups of 4 (perfect balance)
    
    // 30 players: groups of 5 or 6 work well
    expect(getGroupSize(30)).toBe(3) // 10 groups of 3 (perfect balance)
  })

  test('Group size stays within reasonable bounds', () => {
    // Test various player counts to ensure group size is always 3-6
    const playerCounts = [1, 7, 11, 13, 17, 19, 23, 25, 31, 37, 50, 100]
    
    playerCounts.forEach(count => {
      const groupSize = getGroupSize(count)
      expect(groupSize).toBeGreaterThanOrEqual(3)
      expect(groupSize).toBeLessThanOrEqual(6)
    })
  })

  test('Consistent results for same input', () => {
    // Function should be deterministic
    const testCounts = [8, 12, 16, 20, 24]
    
    testCounts.forEach(count => {
      const result1 = getGroupSize(count)
      const result2 = getGroupSize(count)
      expect(result1).toBe(result2)
    })
  })

  test('Preference for size 4 when scores are equal', () => {
    // Test cases where multiple group sizes might have similar scores
    // The algorithm should prefer 4 when possible
    
    // 8 players: group size 4 should be optimal (2 groups of 4)
    expect(getGroupSize(8)).toBe(4)
    
    // 12 players: group size 4 should be optimal (3 groups of 4)
    expect(getGroupSize(12)).toBe(4)
  })

})
