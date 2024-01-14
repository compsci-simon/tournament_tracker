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
  // api.tournament.progressToNextKnockoutRound.useQuery({ tournamentId: games[0].tournamentId })
  const { nodes, edges } = calculatedNodePositions(TOPLEFT, BOTTOMRIGHT, games)

  return (
    <Box padding={4} height='100%'>
      <div style={{ width: '700px', height: '100%', border: '1px solid black', overflow: 'hidden' }}>
        <div style={{ width: '500px', height: 'calc(100% + 20px)' }}>
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
          />
        </div>
      </div>
    </Box>
  )
}

export default KnockoutTree