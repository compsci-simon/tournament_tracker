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