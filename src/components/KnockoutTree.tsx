import { Box } from '@mui/material'
import React, { useMemo } from 'react'
import ReactFlow from 'reactflow'
import { calculatedNodePositions, scheduleMultiStageGames } from '~/utils/tournament'
import GroupStageNode from './GroupStageNode'
import KnockoutNode from './KnockoutNode'

const TOPLEFT = {
  x: 100,
  y: 100
}

const BOTTOMRIGHT = {
  x: 700,
  y: 700
}

const KnockoutTree = ({ players }: { players: { name: string }[] }) => {
  const { gameSchedule } = scheduleMultiStageGames(players.map(p => p.name))
  const schedule = gameSchedule.filter(m => m.type == 'knockout').reduce((acc, curr, index) => {
    return {
      ...acc,
      [index]: curr
    }
  }, {})
  const nodeTypes = useMemo(() => ({ groupStageNode: GroupStageNode, knockoutNode: KnockoutNode }), []);
  const { nodes, edges: initialEdges } = calculatedNodePositions(TOPLEFT, BOTTOMRIGHT, schedule)

  const initialNodes = nodes.map((stage, index) => {
    return {
      id: `${index}`,
      position: { x: stage.x, y: stage.y },
      data: { date: null, player1: stage.player1Id, player2: stage.player2Id, winner: null },
      type: stage.level == 0 ? 'groupStageNode' : 'knockoutNode'
    }
  })

  return (
    <Box padding={4} height='100%'>
      <div style={{ width: '500px', height: '500px', border: '1px solid black', overflow: 'hidden' }}>
        <div style={{ width: '500px', height: '520px' }}>
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
  )
}

export default KnockoutTree