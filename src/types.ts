import { Prisma, Game, Rating, User } from "@prisma/client"

export type nodeProps = (Game & { player1: User, player2: User })

export type ElementType<T> = T extends Array<infer U> ? U : never;

export type coordinate = {
  x: number
  y: number
}

const ratingWithPlayer = Prisma.validator<Prisma.RatingFindManyArgs>()({
  include: { player: true }
})
const gameWithPlayers = Prisma.validator<Prisma.GameFindManyArgs>()({
  include: {
    player1: true,
    player2: true
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

export type RatingWithPlayer = Prisma.RatingGetPayload<typeof ratingWithPlayer>
export type GameWithPlayers = Prisma.GameGetPayload<typeof gameWithPlayers>
export type TournamentWithGames = Prisma.TournamentGetPayload<typeof tournamentWithGames>
export type TournamentWithGamesWithPlayers = Prisma.TournamentGetPayload<typeof tournamentWithGamesWithPlayers>
