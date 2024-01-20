import { Box } from '@mui/material'
import 'reactflow/dist/style.css';
import React, { useMemo } from 'react'
import ReactFlow from 'reactflow'
import GroupStageNode from './GroupStageNode'
import KnockoutNode from './KnockoutNode'
import { calculatedNodePositions } from '~/utils/tournament';
import { GameType } from '~/type';

const TOPLEFT = {
  x: 0,
  y: 0
}

const BOTTOMRIGHT = {
  x: 600,
  y: 600
}
const NodeTypes = { groupStageNode: GroupStageNode, knockoutNode: KnockoutNode }

const KnockoutTree = ({ games }: { games: GameType[] }) => {
  const { nodes, edges } = calculatedNodePositions(TOPLEFT, BOTTOMRIGHT, games)

  return (
    <Box padding={4} height='100%' display='flex' alignContent='center'>
      <ReactFlow
        nodeOrigin={[0.5, 0.5]}
        nodeTypes={NodeTypes}
        nodes={nodes}
        edges={edges}
        panOnDrag={false}
        preventScrolling={true}
        zoomOnScroll={false}
        zoomOnDoubleClick={false}
        fitView
        proOptions={{
          hideAttribution: true
        }}
      />
    </Box>
  )
}

export default KnockoutTree