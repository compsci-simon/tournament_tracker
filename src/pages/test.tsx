import { Box, Paper } from "@mui/material"
import { useMemo } from "react";
import ReactFlow from 'reactflow';
import 'reactflow/dist/style.css';
import GroupStageNode from "~/components/GroupStageNode";
import KnockoutNode from "~/components/KnockoutNode";
import { calculatedNodePositions, scheduleMultiStageGames } from "~/utils/tournament";


const stages = {
  0: {
    players: ['TBD', 'TBD'],
    level: 0
  },
  1: {
    players: ['TBD', 'TBD'],
    level: 0
  },
  2: {
    players: ['TBD', 'TBD'],
    level: 0
  },
  3: {
    players: ['TBD', 'TBD'],
    level: 0
  },
  4: {
    players: ['TBD', 'TBD'],
    level: 1
  },
  5: {
    players: ['TBD', 'TBD'],
    level: 1
  },
  6: {
    players: ['TBD', 'TBD'],
    level: 2
  }
}

const topLeft = {
  x: 100,
  y: 100
}

const bottomRight = {
  x: 700,
  y: 700
}

const players = [
  {
    id: '0',
    name: 'Simon'
  },
  {
    id: '1',
    name: 'Mike'
  },
  {
    id: '2',
    name: 'Tim S'
  },
  {
    id: '3',
    name: 'Jeremy'
  },
  {
    id: '4',
    name: 'Tim D'
  },
  {
    id: '5',
    name: 'Imran'
  },
  {
    id: '6',
    name: 'Warren'
  },
  {
    id: '7',
    name: 'Matt'
  },
  {
    id: '8',
    name: 'Sizwe'
  },
  {
    id: '9',
    name: 'Ralph'
  },
  {
    id: '10',
    name: 'Paul'
  }
]

function Test() {

  const nodeTypes = useMemo(() => ({ groupStageNode: GroupStageNode, knockoutNode: KnockoutNode }), []);
  const { nodes, edges: initialEdges } = calculatedNodePositions(topLeft, bottomRight, stages)

  const initialNodes = nodes.map((stage, index) => {
    return {
      id: `${index}`,
      position: { x: stage.x, y: stage.y },
      data: { label: stage.players },
      type: stage.level == 0 ? 'groupStageNode' : 'knockoutNode'
    }
  })
  const matches = scheduleMultiStageGames(players)

  return <Box padding={4} height='100%'>
    <div style={{ width: '100%', height: '100%', border: '1px solid black' }}>
      {/* <ReactFlow nodeOrigin={[0.5, 0.5]} nodeTypes={nodeTypes} nodes={initialNodes} edges={initialEdges} /> */}
      <h4>
        <pre>
          {JSON.stringify(matches, null, 2)}
        </pre>
      </h4>
    </div>
  </Box>
}

export default Test