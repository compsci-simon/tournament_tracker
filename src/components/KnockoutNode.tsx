import React, { useState } from "react";
import { Box, Button, Typography } from "@mui/material";
import { Handle, Position } from "reactflow";

import { NODESTYLE } from "~/utils/constants";
import SetGamePointsModal from "./SetGamePointsModal";
import { SetGameType, api } from "~/utils/api";
import { GameWithPlayers } from "~/types";
import { useRouter } from "next/router";

function KnockoutNode({ data: game }: { data: GameWithPlayers }) {
  const router = useRouter()
  const tournamentId = router.query.id as string
  const [showDialog, setShowDialog] = useState(false)
  const [player1Points, setPlayer1Points] = useState(game.player1Points)
  const [player2Points, setPlayer2Points] = useState(game.player2Points)
  const utils = api.useContext()
  let label = `${game?.player1?.name ?? 'TBD'} vs ${game?.player2?.name ?? 'TBD'}`
  let scoreLabel = ''
  if (!(game.player1) && !(game.player2)) {
    label = 'To be determined...'
  } else {
    scoreLabel = `${game.player1Points} - ${game.player2Points}`
  }
  const onSuccess = (data: SetGameType) => {
    // utils.tournament.getTournament.setData({
    //   id: tournamentId
    // }, (oldData) => {
    //   const updatedGame = data.updatedGame
    //   const nextRound = data.nextRound
    //   const newData = {
    //     ...oldData,
    //     games: oldData.games.map(game => {
    //       if (game.id == updatedGame?.id) {
    //         return { ...updatedGame }
    //       } else if (game.id == nextRound.id) {
    //         return { ...nextRound }
    //       }
    //       return game
    //     })
    //   }
    //   return newData
    // })
    utils.tournament.getTournament.invalidate() // TODO: Set data properly instead of invalidating all adata
  }

  return (
    <>
      <SetGamePointsModal
        open={showDialog}
        setOpen={setShowDialog}
        player1Points={player1Points}
        setPlayer1Points={setPlayer1Points}
        player2Points={player2Points}
        setPlayer2Points={setPlayer2Points}
        onSuccess={onSuccess}
        game={game}
      />
      <Handle type='source' position={Position.Right} style={{ opacity: 0 }} />
      <Handle type='target' position={Position.Left} style={{ opacity: 0 }} />
      <Box padding={3} sx={NODESTYLE}>
        <Typography sx={{ textAlign: 'center' }}>{label}</Typography>
        <Typography sx={{ textAlign: 'center' }}>{scoreLabel}</Typography>
        <Button
          color='primary'
          variant='outlined'
          disabled={!(game?.player1) || !(game?.player2)}
          onClick={() => setShowDialog(true)}
        >
          Set Score
        </Button>
      </Box>
    </>
  )
}

export default KnockoutNode