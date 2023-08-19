import { Box, Typography } from "@mui/material";
import { Handle, Position } from "reactflow";

const style = {
  backgroundColor: 'white',
  border: '1px solid gray',
  borderRadius: '10px',
  color: 'black',
  minWidth: '130px'
}

function GroupStageNode(props: nodeProps) {
  return (
    <>
      <Handle type='source' position={Position.Right} style={{ opacity: 0 }} />
      <Box padding={3} sx={style}>
        {props.data.date}
        <Typography>{props.data.player1 ?? 'TBD'}</Typography>
        <Typography>{props.data.player2 ?? 'TBD'}</Typography>
      </Box>
    </>
  )
}

export default GroupStageNode