import { Box } from '@mui/material'
import 'reactflow/dist/style.css';
import React from 'react'
import ReactFlow from 'reactflow'
import GroupStageNode from './GroupStageNode'
import KnockoutNode from './KnockoutNode'
import { calculatedNodePositions } from '~/utils/tournament';
import { Game } from '@prisma/client';

const TOPLEFT = {
  x: 0,
  y: 0
}
const NodeTypes = { groupStageNode: GroupStageNode, knockoutNode: KnockoutNode }

const KnockoutTree = ({ games }: { games: Game[] }) => {
  const level0Games = games.filter(g => g.level == 0).length
  const BOTTOMRIGHT = {
    x: (level0Games - 1) * 250, // Change this to horizontally spread the items
    y: level0Games * 150
  }
  const { nodes, edges } = calculatedNodePositions(TOPLEFT, BOTTOMRIGHT, games)

  return (
    <Box height='100%' width='100%' display='flex' justifyContent='center'>
      <Box height='600px' width='100%'>
        <ReactFlow
          nodeOrigin={[0.5, 0.5]}
          nodeTypes={NodeTypes}
          nodes={nodes}
          edges={edges}
          fitView
          zoomOnDoubleClick={false}
          proOptions={{ hideAttribution: true }}
        />
      </Box>
    </Box>
  )
}

export default KnockoutTree