import { useRouter } from "next/router";
import Link from "next/link";
import { useState } from "react";
import { Game } from "@prisma/client";
import {
  Box,
  Button,
  Container,
  Divider,
  Grid,
  List,
  ListItem,
  ListItemText,
  Paper,
  Typography
} from "@mui/material";

import Layout from "~/components/Layout";
import { api } from "~/utils/api";
import SetGamePointsModal from "~/components/SetGamePointsModal";
import { GameWithPlayers } from "~/types";

export default function PlayerGroupGames() {
  const router = useRouter()
  const tournamentId = router.query.id as string
  const playerId = router.query.playerId as string
  const [open, setOpen] = useState(false)
  const [player1Points, setPlayer1Points] = useState(0)
  const [player2Points, setPlayer2Points] = useState(0)
  const [selectedGame, setSelectedGame] = useState<GameWithPlayers | null>(null)
  const utils = api.useContext()

  const { data: tournament, isLoading } = api.tournament.getTournament.useQuery({
    id: tournamentId
  })

  if (isLoading) {
    return <div>Loading..</div>
  }

  const playerGames = tournament.games.filter(game => [game.player1Id, game.player2Id].includes(playerId))

  function onSuccess(data: { nextRound: undefined, updatedGame: Game }, variables, context) {
    utils.tournament.getTournament.setData({
      id: tournamentId
    }, (oldData) => {
      const updatedGame = data.updatedGame
      return {
        ...oldData,
        games: oldData.games.map(game => {
          if (game.id == updatedGame.id) {
            return {
              ...game,
              player1Points: updatedGame.player1Points,
              player2Points: updatedGame.player2Points,
              time: updatedGame.time
            }
          }
          return game
        })
      }
    })
  }

  return (
    <Container>
      <SetGamePointsModal
        open={open}
        setOpen={setOpen}
        player1Points={player1Points}
        setPlayer1Points={setPlayer1Points}
        player2Points={player2Points}
        setPlayer2Points={setPlayer2Points}
        onSuccess={onSuccess}
        game={selectedGame}
      />
      <Box padding={2}>
        <Paper>
          <Box padding={2}>
            <Link href={`/tournaments/${router.query.id}`}>
              <Typography sx={{ textDecoration: 'underline' }} fontSize={18} padding={2}>/tournaments/{tournament.name}</Typography>
            </Link>
            <List disablePadding>
              <ListItem>
                <Grid container>
                  <Grid item xs={3}>
                    <ListItemText>Player 1</ListItemText>
                  </Grid>
                  <Grid item xs={3}>
                    <ListItemText>Player 2</ListItemText>
                  </Grid>
                  <Grid item xs={3}>
                    <ListItemText>score</ListItemText>
                  </Grid>
                  <Grid item xs={3}>
                    <ListItemText>Set score</ListItemText>
                  </Grid>
                </Grid>
              </ListItem>
              <Divider />
              {playerGames.map(game => {
                return (
                  <Box key={game.id}>
                    <ListItem>
                      <Grid container>
                        <Grid item xs={3}>
                          <ListItemText>{game.player1?.name}</ListItemText>
                        </Grid>
                        <Grid item xs={3}>
                          <ListItemText>{game.player2?.name}</ListItemText>
                        </Grid>
                        <Grid item xs={3}>
                          {game.player1Points}-{game.player2Points}
                        </Grid>
                        <Grid item xs={3}>
                          <Button
                            onClick={() => {
                              setSelectedGame(game)
                              setPlayer1Points(game.player1Points)
                              setPlayer2Points(game.player2Points)
                              setOpen(true)
                            }}
                          >
                            Set score
                          </Button>
                        </Grid>
                      </Grid>
                    </ListItem>
                    <Divider />
                  </Box>
                )
              })}
            </List>
          </Box>
        </Paper>
      </Box>
    </Container>
  )
}

PlayerGroupGames.getLayout = function getLayout(page: React.ReactElement) {
  return (
    <Layout>
      {page}
    </Layout>
  )
}
