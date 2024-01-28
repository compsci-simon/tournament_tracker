import { Box, Button, Paper, Stack, Typography } from '@mui/material'
import { useRouter } from 'next/router'
import { enqueueSnackbar } from 'notistack'
import React, { useEffect, useState } from 'react'
import Layout from '~/components/Layout'
import SetGamePointsModal from '~/components/SetGamePointsModal'
import { api } from '~/utils/api'

export default function Page() {
  const router = useRouter()
  const { query } = router
  const [modalOpen, setModalOpen] = useState(false)
  const [player1Points, setPlayer1Points] = useState(0)
  const [player2Points, setPlayer2Points] = useState(0)
  let gameId = query.id
  if (Array.isArray(gameId)) {
    gameId = 'no defined'
    console.error('An invalid game ID was provided')
  }
  const { data: game, isLoading } = api.games.getGame.useQuery({
    gameId: gameId
  })
  const { mutate: deleteGame } = api.games.deleteGame.useMutation({
    onSuccess() {
      router.push('/games')
      enqueueSnackbar('Successfully deleted game', { variant: 'success' })
    }
  })
  const context = api.useContext()

  const onSuccess = (data) => {
    context.games.getGame.setData({
      gameId
    }, (oldData) => {
      enqueueSnackbar('Successfully updated game', { variant: 'success' })
      return {
        ...oldData,
        player1Points: player1Points,
        player2Points: player2Points
      }
    })
  }

  useEffect(() => {
    setPlayer1Points(game.player1Points)
    setPlayer2Points(game.player2Points)
  }, [game])


  if (isLoading) return null

  return (
    <>
      <SetGamePointsModal
        open={modalOpen}
        setOpen={setModalOpen}
        player1Points={player1Points}
        setPlayer1Points={setPlayer1Points}
        player2Points={player2Points}
        setPlayer2Points={setPlayer2Points}
        onSuccess={onSuccess}
        game={game}
      />
      <Stack justifyContent='center' alignItems='center' height='100%'>
        <Paper elevation={2}>
          <Box p={2}>
            <Stack spacing={2}>
              <Typography variant='h5'>Date: {game?.time.toDateString()}</Typography>
              <Stack alignItems='center' direction='row' spacing={2}>
                <img src={game.player1.avatar} style={{ width: '40px' }} />
                <Typography>{game?.player1?.name}: {player1Points}</Typography>
              </Stack>
              <Stack alignItems='center' direction='row' spacing={2}>
                <img src={game.player2.avatar} style={{ width: '40px' }} />
                <Typography>{game?.player2?.name}: {player2Points}</Typography>
              </Stack>
              <Stack direction='row' spacing={2}>
                <Button
                  variant='outlined'
                  fullWidth
                  onClick={() => setModalOpen(true)}
                >
                  Edit
                </Button>
                <Button
                  color='error'
                  variant='outlined'
                  fullWidth
                  onClick={() => deleteGame({ gameId: game.id })}
                >
                  Delete
                </Button>
              </Stack>
            </Stack>
          </Box>
        </Paper>
      </Stack>
    </>
  )
}

Page.getLayout = function getLayout(page: React.ReactElement) {
  return (
    <Layout>
      {page}
    </Layout>
  )
}
