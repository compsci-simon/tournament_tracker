import React, { useState } from "react";
import { Box, Button, Typography } from "@mui/material";
import { Handle, Position } from "reactflow";

import { nodeProps } from "~/type";
import { NODESTYLE } from "~/utils/constants";
import SetGamePointsModal from "./SetGamePointsModal";

function KnockoutNode(props: nodeProps) {
  const [showDialog, setShowDialog] = useState(false)
  const [player1Points, setPlayer1Points] = useState(props.data.player1Points)
  const [player2Points, setPlayer2Points] = useState(props.data.player2Points)
  let label = ''
  if (!(props.data.player1) && !(props.data.player2)) {
    label = 'To be determined...'
  } else {
    label = `${props.data?.player1?.name} vs ${props.data?.player2?.name}`
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
        game={props.data}
      />
      <Handle type='source' position={Position.Right} style={{ opacity: 0 }} />
      <Handle type='target' position={Position.Left} style={{ opacity: 0 }} />
      <Box padding={3} sx={NODESTYLE}>
        <Typography>{label}</Typography>
        <Button
          color='primary'
          variant='outlined'
          disabled={!(props.data?.player1) || !(props.data?.player2)}
          onClick={() => setShowDialog(true)}
        >
          Set Score
        </Button>
      </Box>
    </>
  )
}

export default KnockoutNode