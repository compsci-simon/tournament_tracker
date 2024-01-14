import { Game, User } from "@prisma/client"

export type nodeProps = {
  id: string,
  data: {
    player1: User | null,
    player2: User | null,
    game: (Game & { player1: User, player2: User }) | null
  }
}

export type TournamentType = RouterOutputs['tournament']['getTournament']
export type GameType = ElementType<TournamentType['games']>
