import { Box, Button, Paper, Stack, Tooltip, Typography } from '@mui/material'
import assert from 'assert'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import { enqueueSnackbar } from 'notistack'
import React, { useEffect, useState } from 'react'
import Layout from '~/components/Layout'
import SetGamePointsModal from '~/components/SetGamePointsModal'
import { api } from '~/utils/api'
import { capitalizeFirstLetter, getString } from '~/utils/utils'

export default function Page() {
  const router = useRouter()
  const { data: session } = useSession()
  const { query } = router
  const [modalOpen, setModalOpen] = useState(false)
  const [player1Points, setPlayer1Points] = useState(0)
  const [player2Points, setPlayer2Points] = useState(0)
  const gameId = getString(query.id)
  let canEditGame = false
  const { data: game, isLoading } = api.games.getGame.useQuery({
    gameId: gameId ?? ''
  }, {
    enabled: Boolean(gameId)
  })
  const { mutate: deleteGame } = api.games.deleteGame.useMutation({
    onSuccess() {
      void router.push('/games').then(() => {
        enqueueSnackbar('Successfully deleted game', { variant: 'success' })
      })
    }
  })
  const { mutate: setSeenByPlayer } = api.notifications.setGameSeen.useMutation()
  const context = api.useContext()

  const onSuccess = () => {
    context.games.getGame.setData({
      gameId
    }, (oldData) => {
      if (!oldData) return oldData
      enqueueSnackbar('Successfully updated game', { variant: 'success' })
      return {
        ...oldData,
        player1Points: player1Points,
        player2Points: player2Points
      }
    })
  }

  useEffect(() => {
    setPlayer1Points(game?.player1Points ?? 0)
    setPlayer2Points(game?.player2Points ?? 0)
  }, [game])

  useEffect(() => {
    if (game) {
      setSeenByPlayer({ gameId: game.id })
    }
  }, [])

  if (isLoading || !game) return null

  // We need a session to continue
  if (!session || !session.user || !session.user.email) return
  canEditGame = session.user && ([game.player1?.email, game.player2?.email].includes(session.user.email) || session?.user.role == 'admin')
  const cantEditMessage = 'You must be admin or involded in this game'


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
              <Typography variant='h5'>{capitalizeFirstLetter(game?.type)} game</Typography>
              <Typography variant='caption' sx={{ opacity: '0.6' }}>{game?.time.toDateString()}</Typography>

              <Stack alignItems='center' direction='row' spacing={2}>
                <img src={game?.player1?.avatar} style={{ width: '40px' }} />
                <Typography>{game?.player1?.name}: {player1Points}</Typography>
              </Stack>
              <Stack alignItems='center' direction='row' spacing={2}>
                <img src={game?.player2?.avatar} style={{ width: '40px' }} />
                <Typography>{game?.player2?.name}: {player2Points}</Typography>
              </Stack>

              <Stack direction='row' spacing={2} justifyContent='center'>
                <Tooltip title={!canEditGame && cantEditMessage} placement='top' arrow>
                  <span>
                    <Button
                      variant='outlined'
                      fullWidth
                      onClick={() => setModalOpen(true)}
                      disabled={!canEditGame}
                    >
                      Edit
                    </Button>
                  </span>
                </Tooltip>
                <Tooltip title={(!canEditGame && cantEditMessage) || (game.type != 'quick' && 'You may only delete quick games')} placement='top' arrow>
                  <span>
                    <Button
                      color='error'
                      variant='outlined'
                      fullWidth
                      onClick={() => deleteGame({ gameId: game.id })}
                      disabled={!canEditGame || game.type != 'quick'}
                    >
                      Delete
                    </Button>
                  </span>
                </Tooltip>
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
