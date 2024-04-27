import React from 'react'
import {
  Box,
  Button,
  CircularProgress,
  Modal,
  Stack,
  TextField,
  Typography
} from '@mui/material'
import ReplayIcon from '@mui/icons-material/Replay';

import { api } from '~/utils/api';
import { modalStyle } from "~/utils/constants";
import { GameWithPlayers } from '~/types';

const SetGamePointsModal = ({
  open,
  setOpen,
  player1Points,
  setPlayer1Points,
  player2Points,
  setPlayer2Points,
  onSuccess,
  game
}: {
  open: boolean,
  setOpen: React.Dispatch<boolean>,
  player1Points: number,
  setPlayer1Points: React.Dispatch<number>,
  player2Points: number,
  setPlayer2Points: React.Dispatch<number>,
  onSuccess: (data, variables, context) => void
  game: GameWithPlayers
}) => {
  const { mutate: updatePointsMutation, isLoading } = api.tournament.setGamePoints.useMutation({ onSuccess })
  const resetScores = () => {
    setPlayer1Points(0)
    setPlayer2Points(0)
    updatePointsMutation({ gameId: game.id, player1Points: 0, player2Points: 0 })
  }
  if (!game) return null

  if (isLoading) {
    return <CircularProgress />
  }

  return (
    <Modal open={open} onClose={() => setOpen(false)}>
      <Box sx={modalStyle}>
        <Stack spacing={2}>
          <Typography>{game.player1?.name}</Typography>
          <TextField
            label='Points'
            type='number'
            value={player1Points}
            onChange={e => {
              if (parseInt(e.target.value) > 0) {
                setPlayer1Points(parseInt(e.target.value))
              } else {
                setPlayer1Points(0)
              }
            }}
          />
          <Typography>{game.player2?.name ?? ''}</Typography>
          <TextField
            label='Points'
            type='number'
            value={player2Points}
            onChange={e => {
              if (parseInt(e.target.value) > 0) {
                setPlayer2Points(parseInt(e.target.value))
              } else {
                setPlayer2Points(0)
              }
            }}
          />
          <Stack direction='row' spacing={2}>
            <Button
              variant="outlined"
              onClick={() => {
                updatePointsMutation({ gameId: game.id, player1Points, player2Points })
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
  )
}

export default SetGamePointsModal