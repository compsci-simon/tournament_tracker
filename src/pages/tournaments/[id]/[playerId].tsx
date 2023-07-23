import { Box } from "@mui/material";
import Layout from "~/components/Layout";
import { prisma } from '../../../server/db'


export default function PlayerGroupGames({ games }) {
  return <Box>
    {JSON.stringify(games, null, 2)}
  </Box>
}

PlayerGroupGames.getLayout = function getLayout(page: React.ReactElement) {
  return <Layout>
    {page}
  </Layout>
}

export async function getServerSideProps(context: { query: { [key: string]: string } }) {
  const tournamentId = context['params']['id']
  const playerId = context['params']['playerId']
  const games = await prisma.game.findMany({
    where: {
      tournamentId: tournamentId,
      type: 'group',
      OR: [
        { player1Id: playerId },
        { player2Id: playerId }
      ]
    }
  })

  return {
    props: {
      games: games.map(game => ({ ...game, time: game.time.toLocaleString() }))
    }
  }
}