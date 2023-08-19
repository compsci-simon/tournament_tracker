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

type GameType = ElementType<RouterOutputs['tournament']['getTournamentPlayerGroupGames']>

export default function PlayerGroupGames() {
  const router = useRouter()
  const tournamentId = router.query.id as string
  const playerId = router.query.playerId as string
  const [open, setOpen] = useState(false)
  const [player1Points, setPlayer1Points] = useState(0)
  const [player2Points, setPlayer2Points] = useState(0)
  const [selectedGame, setSelectedGame] = useState<GameType | null>(null)
  const utils = api.useContext();
  const { mutate: updatePointsMutation } = api.tournament.setGamePoints.useMutation({
    onSuccess(data, variables, context) {
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
            }
          }
          return game
        })
      })
    },
  })
  const resetScores = () => {
    setPlayer1Points(0)
    setPlayer2Points(0)
    updatePointsMutation({ gameId: selectedGame?.id ?? '', player1Points: 0, player2Points: 0 })
  }
  const { data, isLoading } = api.tournament.getTournamentPlayerGroupGames.useQuery({
    tournamentId,
    playerId
  }, {
    enabled: tournamentId !== undefined
  })

  if (isLoading) {
    return <div>
      Loading...
    </div>
  }

  return <Container>
    <Modal
      open={open}
      onClose={() => setOpen(false)}
    >
      <Box sx={modalStyle}>
        <Stack spacing={2}>
          <Typography>{selectedGame?.player1?.name}</Typography>
          <TextField
            label='Points'
            type='number'
            value={player1Points}
            onChange={e => {
              if (parseInt(e.target.value) >= 0) {
                setPlayer1Points(parseInt(e.target.value))
              }
            }}
          />
          <Typography>{selectedGame?.player2?.name ?? ''}</Typography>
          <TextField
            label='Points'
            type='number'
            value={player2Points}
            onChange={e => {
              if (parseInt(e.target.value) >= 0) {
                setPlayer2Points(parseInt(e.target.value))
              }
            }}
          />
          <Stack direction='row' spacing={2}>
            <Button
              variant="outlined"
              onClick={() => {
                updatePointsMutation({ gameId: selectedGame?.id ?? '', player1Points, player2Points })
                setOpen(false)
              }}
            >
              Submit
            </Button>
            <Button color='warning' variant="outlined" endIcon={<ReplayIcon />} onClick={resetScores}>
              Reset
            </Button>
          </Stack>
        </Stack>
      </Box>
    </Modal>
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
}

PlayerGroupGames.getLayout = function getLayout(page: React.ReactElement) {
  return <Layout>
    {page}
  </Layout>
}
