import { Box, Button, Container, Divider, Grid, List, ListItem, ListItemText, Modal, Paper, Stack, TextField, Typography } from "@mui/material";
import Layout from "~/components/Layout";
import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";
import { modalStyle } from "~/utils/constants";
import { api } from "~/utils/api";
import { RouterOutputs } from "~/server/api/trpc"

import ReplayIcon from '@mui/icons-material/Replay';
import { ElementType } from "~/utils/utils";
import SetGamePointsModal from "~/components/SetGamePointsModal";
import { Game } from "@prisma/client";

type GameType = ElementType<RouterOutputs['tournament']['getTournamentPlayerGroupGames']>

export default function PlayerGroupGames() {
  const router = useRouter()
  const tournamentId = router.query.id as string
  const playerId = router.query.playerId as string
  const [open, setOpen] = useState(false)
  const [player1Points, setPlayer1Points] = useState(0)
  const [player2Points, setPlayer2Points] = useState(0)
  const [selectedGame, setSelectedGame] = useState<GameType | null>(null)
  const utils = api.useContext()

  const { data, isLoading } = api.tournament.getTournamentPlayerGroupGames.useQuery({
    tournamentId,
    playerId
  }, {
    enabled: tournamentId !== undefined
  })

  if (isLoading) {
    return <div>Loading..</div>
  }
  function onSuccess(data: Game, variables, context) {
    utils.tournament.getTournamentPlayerGroupGames.setData({
      tournamentId,
      playerId
    }, (oldData) => {
      return oldData.map(game => {
        if (game.id == data.id) {
          return {
            ...game,
            player1Points: data.player1Points,
            player2Points: data.player2Points,
            time: data.time
          }
        }
        return game
      })
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
              <Typography sx={{ textDecoration: 'underline' }} fontSize={18} padding={2}>/tournaments/{data[0]?.Tournament.name}</Typography>
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
              {data.map(game => {
                return <Box key={game.id}>
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
              })}
            </List>
          </Box>
        </Paper>
      </Box>
    </Container>
  )
}

PlayerGroupGames.getLayout = function getLayout(page: React.ReactElement) {
  return <Layout>
    {page}
  </Layout>
}
