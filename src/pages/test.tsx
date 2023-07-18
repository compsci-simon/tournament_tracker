import { Box, Paper } from "@mui/material"
import { useMemo } from "react";
import ReactFlow from 'reactflow';
import 'reactflow/dist/style.css';
import GroupStageNode from "~/components/GroupStageNode";




function Test() {

  const nodeTypes = useMemo(() => ({ groupStageNode: GroupStageNode }), []);

  const initialNodes = [
    { id: '1', position: { x: 100, y: 100 }, data: { label: '1' }, type: 'groupStageNode' },
    { id: '2', position: { x: 100, y: 200 }, data: { label: '2' }, type: 'output' },
  ]

  const initialEdges = []

  return <Box padding={4} height='100%'>
    <div style={{ width: '100%', height: '100%', border: '1px solid black' }}>
      <ReactFlow nodeTypes={nodeTypes} nodes={initialNodes} edges={initialEdges} />
    </div>
  </Box>
}

export default Test