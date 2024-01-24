import { Box, Typography } from "@mui/material";
import { Handle, Position } from "reactflow";
import { GameWithPlayers } from "~/types";
import { NODESTYLE } from "~/utils/constants";

function GroupStageNode({ data }: { data: GameWithPlayers }) {
  return (
    <>
      <Handle type='source' position={Position.Right} style={{ opacity: 0 }} />
      <Box padding={3} sx={NODESTYLE}>
        <Typography>{data.player1?.name ?? 'TBD'}</Typography>
        <Typography>{data.player2?.name ?? 'TBD'}</Typography>
      </Box>
    </>
  )
}

export default GroupStageNode