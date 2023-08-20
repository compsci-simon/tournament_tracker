import { Box } from '@mui/material'
import 'reactflow/dist/style.css';
import React, { useMemo } from 'react'
import ReactFlow, { MarkerType } from 'reactflow'
import GroupStageNode from './GroupStageNode'
import KnockoutNode from './KnockoutNode'
import { RouterOutputs } from "~/server/api/trpc"
import { calculatedNodePositions } from '~/utils/tournament';

type GamesType = RouterOutputs['tournament']['getTournament']['games']

const TOPLEFT = {
  x: 0,
  y: 0
}

const BOTTOMRIGHT = {
  x: 600,
  y: 600
}

const KnockoutTree = ({ games }: { games: GamesType }) => {
  const nodeTypes = useMemo(() => ({ groupStageNode: GroupStageNode, knockoutNode: KnockoutNode }), []);
  const { nodes, edges: initialEdges } = calculatedNodePositions(TOPLEFT, BOTTOMRIGHT, games.reduce((acc, curr, index) => {
    return {
      ...acc,
      [index]: curr
    }
  }, {}))

  const initialNodes = nodes.map((stage, index) => {
    return {
      id: `${index}`,
      position: { x: stage.x, y: stage.y },
      data: { date: null, player1: stage.player1Id, player2: stage.player2Id, winner: null },
      type: stage.level == 0 ? 'groupStageNode' : 'knockoutNode'
    }
  })

  return <Box padding={4} height='100%'>
    <div style={{ width: '500px', height: '100%', border: '1px solid black', overflow: 'hidden' }}>
      <div style={{ width: '500px', height: 'calc(100% + 20px)' }}>
        <ReactFlow
          nodeOrigin={[0.5, 0.5]}
          nodeTypes={nodeTypes}
          nodes={initialNodes}
          edges={initialEdges}
          panOnDrag={false}
          preventScrolling={true}
          zoomOnScroll={false}
          zoomOnDoubleClick={false}
          fitView
        />
      </div>
    </div>
  </Box>
}

export default KnockoutTree