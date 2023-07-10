import { Box, Button, MenuItem, Paper, Select, Stack, TextField, Typography } from "@mui/material"
import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import Layout from "~/components/Layout"
import { api } from "~/utils/api"
import { enqueueSnackbar } from "notistack"

export default function Page() {
  const [player1, setPlayer1] = useState('')
  const [player2, setPlayer2] = useState('')
  const [player1Score, setPlayer1Score] = useState(0)
  const [player2Score, setPlayer2Score] = useState(0)
  const { data: users } = api.user.getAll.useQuery()
  const { mutate: createGameMutation } = api.games.createQuickGame.useMutation({
    onSuccess() {
      enqueueSnackbar('Successfully created quick game', { variant: 'success' })
    },
    onError() {
      enqueueSnackbar('Failed to create quick game', { variant: 'error' })
    }
  })
  const { data: session } = useSession()
  useEffect(() => {
    setPlayer1(session?.user.email ?? '')
  }, [session])

  const createGame = () => {
    if (!player1 || !player2 || (!player1Score && !player2Score)) {
      return
    }
    createGameMutation({
      player1Email: player1,
      player2Email: player2,
      player1Score,
      player2Score,
    })
    setPlayer2('')
    setPlayer1Score(0)
    setPlayer2Score(0)
  }

  return <Box padding={4} >
    <Box maxWidth={700} margin='auto'>
      <Paper>
        <Box padding={4}>
          <Stack spacing={2} alignItems='center'>
            <Typography variant='h5'>Quick informal game</Typography>
            <Stack direction='row' justifyContent='space-around' alignItems='center'>
              <Stack spacing={2}>
                <Select
                  value={player1}
                  onChange={e => setPlayer1(e.target.value)}
                  label="Player 1"
                  fullWidth
                  disabled
                >
                  <MenuItem value={player1}>
                    <em>{users?.filter(u => u.email == player1)[0]?.name} (You)</em>
                  </MenuItem>
                </Select>
                <TextField
                  label='score'
                  type='number'
                  value={player1Score}
                  onChange={e => {
                    if (parseInt(e.target.value) >= 0) {
                      setPlayer1Score(parseInt(e.target.value))
                    }
                  }}
                />
              </Stack>
              <Box padding={2}>
                <Paper elevation={0} variant="outlined">
                  <Box padding={2}>
                    VS
                  </Box>
                </Paper>
              </Box>
              <Stack spacing={2}>
                <Select
                  value={player2}
                  onChange={e => setPlayer2(e.target.value)}
                  label="Player 2"
                  fullWidth
                >
                  <MenuItem value={''}>
                    <em>None</em>
                  </MenuItem>
                  {users?.filter(user => user.email != player1).map(player => {
                    return <MenuItem key={player.id} value={player.email}>
                      {player.name}
                    </MenuItem>
                  })}
                </Select>
                <TextField
                  label='score'
                  type='number'
                  value={player2Score}
                  onChange={e => {
                    if (parseInt(e.target.value) >= 0) {
                      setPlayer2Score(parseInt(e.target.value))
                    }
                  }}
                />
              </Stack>
            </Stack>
            <Box>
              <Button variant='outlined' onClick={createGame}>
                Create
              </Button>
            </Box>
          </Stack>
        </Box>
      </Paper>
    </Box>
  </Box >
}

Page.getLayout = function getLayout(page: React.ReactElement) {
  return <Layout>
    {page}
  </Layout>
}