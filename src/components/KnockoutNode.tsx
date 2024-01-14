import { Box, Typography } from "@mui/material";
import React from "react";
import { Handle, Position } from "reactflow";
import { nodeProps } from "~/type";
import { NODESTYLE } from "~/utils/constants";

function KnockoutNode(props: nodeProps) {
  console.log(props)
  return (
    <>
      <Handle type='source' position={Position.Right} style={{ opacity: 0 }} />
      <Handle type='target' position={Position.Left} style={{ opacity: 0 }} />
      <Box padding={3} sx={NODESTYLE}>
        <Typography>{props.data.game.player1?.name ?? 'TBD'}</Typography>
        <Typography>{props.data.game.player2?.name ?? 'TBD'}</Typography>
      </Box>
    </>
  )
}

export default KnockoutNode