import { Box } from "@mui/material";
import { Handle, Position } from "reactflow";

const style = {
  backgroundColor: 'white',
  border: '1px solid black',
  borderRadius: '10px',
  color: 'black'
}

function GroupStageNode({ data }) {
  return (
    <>
      <Handle type='target' position={Position.Right} />
      <Box padding={3} sx={style}>
        <label>test</label>
      </Box>
    </>
  )
}

export default GroupStageNode