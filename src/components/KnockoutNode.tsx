import { Box, Typography } from "@mui/material";
import { Handle, Position } from "reactflow";

const style = {
  backgroundColor: 'white',
  border: '1px solid black',
  borderRadius: '10px',
  color: 'black',
  minWidth: '130px'
}

type nodeProps = {
  id: string,
  data: {
    label: string[]
  }
}

function KnockoutNode(props: nodeProps) {
  return (
    <>
      <Handle type='source' position={Position.Right} style={{ opacity: 0 }} />
      <Handle type='target' position={Position.Left} style={{ opacity: 0 }} />
      <Box padding={3} sx={style}>
        {props.data.label.map(label => (<Typography key={label}>{label}</Typography>))}
      </Box>
    </>
  )
}

export default KnockoutNode