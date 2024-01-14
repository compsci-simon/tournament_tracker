import { Game, User } from "@prisma/client"

export type nodeProps = {
  id: string,
  data: (Game & { player1: User, player2: User })
}

export type TournamentType = RouterOutputs['tournament']['getTournament']
export type GameType = ElementType<TournamentType['games']>
