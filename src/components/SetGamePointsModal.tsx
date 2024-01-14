import React from 'react'
import { Box, Button, Modal, Stack, TextField, Typography } from '@mui/material'
import ReplayIcon from '@mui/icons-material/Replay';

import { api } from '~/utils/api';
import { modalStyle } from "~/utils/constants";
import { GameType } from '~/type';

const SetGamePointsModal = ({
  open,
  setOpen,
  player1Points,
  setPlayer1Points,
  player2Points,
  setPlayer2Points,
  game
}: {
  open: boolean,
  setOpen: React.Dispatch<boolean>,
  player1Points: number,
  setPlayer1Points: React.Dispatch<number>,
  player2Points: number,
  setPlayer2Points: React.Dispatch<number>,
  game: GameType
}) => {
  const utils = api.useContext();
  const { mutate: updatePointsMutation } = api.tournament.setGamePoints.useMutation({
    onSuccess(data, variables, context) {
      utils.tournament.getTournament.setData({
        id: game.tournamentId,
      }, (oldData) => {
        console.log('data', data)
        return {
          ...oldData,
          games: oldData.games.map(game => {
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
        }
      })
    },
  })
  const resetScores = () => {
    setPlayer1Points(0)
    setPlayer2Points(0)
    updatePointsMutation({ gameId: game?.id ?? '', player1Points: 0, player2Points: 0 })
  }

  return (
    <Modal
      open={open}
      onClose={() => setOpen(false)}
    >
      <Box sx={modalStyle}>
        <Stack spacing={2}>
          <Typography>{game?.player1?.name}</Typography>
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
          <Typography>{game?.player2?.name ?? ''}</Typography>
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
                updatePointsMutation({ gameId: game?.id ?? '', player1Points, player2Points })
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