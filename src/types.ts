import { Prisma, Game, User } from "@prisma/client"

export type nodeProps = (Game & { player1: User, player2: User })

export type ElementType<T> = T extends Array<infer U> ? U : never;

export type coordinate = {
  x: number
  y: number
}

const ratingWithPlayer = Prisma.validator<Prisma.RatingFindManyArgs>()({
  include: { player: true }
})
const gameWithPlayers = Prisma.validator<Prisma.GameFindFirstArgs>()({
  include: {
    player1: true,
    player2: true
  }
})
const minimalGame = Prisma.validator<Prisma.GameFindFirstArgs>()({
  select: {
    poolId: true,
    player1Id: true,
    player2Id: true
  }
})
const gameWithPlayerMin = Prisma.validator<Prisma.GameFindFirstArgs>()({
  include: {
    player1: {
      select: {
        id: true,
        name: true
      }
    },
    player2: {
      select: {
        id: true,
        name: true
      }
    }
  }
})
const tournamentWithGames = Prisma.validator<Prisma.TournamentFindFirstArgs>()({
  include: { games: true }
})
const tournamentWithGamesWithPlayers = Prisma.validator<Prisma.TournamentFindFirstArgs>()({
  include: {
    games: {
      include: {
        player1: true,
        player2: true
      }
    }
  }
})
const tournamentWithPlayersAndGames = Prisma.validator<Prisma.TournamentFindFirstArgs>()({
  include: {
    games: true,
    players: true
  }
})
const tournamentWithPlayersAndGamesWithPlayers = Prisma.validator<Prisma.TournamentFindFirstArgs>()({
  include: {
    games: {
      include: {
        player1: true,
        player2: true
      }
    },
    players: true
  }
})

export type RatingWithPlayer = Prisma.RatingGetPayload<typeof ratingWithPlayer>
export type MinimalGame = Prisma.GameGetPayload<typeof minimalGame>
export type GameWithPlayers = Prisma.GameGetPayload<typeof gameWithPlayers>
export type GameWithPlayersMin = Prisma.GameGetPayload<typeof gameWithPlayerMin>
export type TournamentWithGames = Prisma.TournamentGetPayload<typeof tournamentWithGames>
export type TournamentWithPlayersAndGames = Prisma.TournamentGetPayload<typeof tournamentWithPlayersAndGames>
export type TournamentWithGamesWithPlayers = Prisma.TournamentGetPayload<typeof tournamentWithGamesWithPlayers>
export type TournamentWithPlayersAndGamesWithPlayers = Prisma.TournamentGetPayload<typeof tournamentWithPlayersAndGamesWithPlayers>
