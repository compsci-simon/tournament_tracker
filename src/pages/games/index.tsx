import { Box, Button, Paper, Typography } from "@mui/material"
import { DataGrid, GridColDef } from "@mui/x-data-grid"
import React, { createContext, useContext, useState } from "react"
import Layout from "~/components/Layout"
import { api } from "~/utils/api"
import { ThemeContext } from "../_app"
import { graphSx } from "~/utils/constants"
import Link from "next/link"
import { GridToolbarContainer } from "@mui/x-data-grid"
import { useSession } from "next-auth/react"

const CustomToolbar = () => {
  const { state: onlyMyGame, setState: setOnlyMyGames } = useContext(StateContext)
  return (
    <GridToolbarContainer>
      <Button color='primary' onClick={() => setOnlyMyGames(!onlyMyGame)}>
        {!onlyMyGame ? 'Only my games' : 'All games'}
      </Button>
    </GridToolbarContainer>
  )
}

const columns: GridColDef[] = [
  {
    field: 'id', width: 400
  },
  {
    field: 'player1', headerName: 'Player 1', sortable: false, filterable: false,
    renderCell(params: { row: { player1: { name: string } } }) {
      return <span>{params.row.player1.name}</span>
    }
  },
  {
    field: 'player2', headerName: 'Player 2', sortable: false, filterable: false,
    renderCell(params: { row: { player2: { name: string } } }) {
      return <span>{params.row.player2.name}</span>
    }
  },
  {
    field: 'score', headerName: 'Score', sortable: false, filterable: false,
    renderCell(params: { row: { player1Points: number, player2Points: number } }) {
      return <span>{params.row.player1Points} - {params.row.player2Points}</span>
    }
  },
  {
    field: 'player1RatingChange', headerName: 'Player 1 rating Δ', width: 150, sortable: false, filterable: false,
    renderCell(params: { row: { player1: { id: string }, ratings: { userId: string, ratingChange: number }[] } }) {
      const player1RatingChange = params.row.ratings.filter(r => r.userId == params.row.player1.id)[0]?.ratingChange
      console.log(params.row.ratings)
      if ((player1RatingChange ?? 0) > 0) {
        return <Typography color='green' sx={{ backgroundColor: '#FEFEFE', borderRadius: '5px', padding: '5px' }}>+{player1RatingChange?.toFixed(3)}</Typography>
      } else {
        return <Typography color='red' sx={{ backgroundColor: '#FEFEFE', borderRadius: '5px', padding: '5px' }}>{player1RatingChange?.toFixed(3)}</Typography>
      }
    }
  },
  {
    field: 'player2RatingChange', headerName: 'Player 2 rating Δ', width: 150, sortable: false, filterable: false,
    renderCell(params: { row: { player2: { id: string }, ratings: { userId: string, ratingChange: number }[] } }) {
      const player2RatingChange = params.row.ratings.filter(r => r.userId == params.row.player2.id)[0]?.ratingChange
      if ((player2RatingChange ?? 0) > 0) {
        return <Typography color='green' sx={{ backgroundColor: '#FEFEFE', borderRadius: '5px', padding: '5px' }}>+{player2RatingChange?.toFixed(3)}</Typography>
      } else {
        return <Typography color='red' sx={{ backgroundColor: '#FEFEFE', borderRadius: '5px', padding: '5px' }}>{player2RatingChange?.toFixed(3)}</Typography>
      }
    }
  },
  {
    field: 'time', headerName: 'Time', width: 200,
    renderCell(params: { row: { time: Date } }) {
      return <span>{params.row.time.toDateString()}</span>
    }
  },
  {
    field: 'type', headerName: 'Game Type', width: 100, sortable: false, editable: false
  },
  {
    field: 'none',
    headerName: 'Delete game',
    width: 200,
    sortable: false,
    filterable: false,
    renderCell(params) {
      return (
        <Link href={`/games/${params.row.id}`}>
          <Button
            variant='outlined'
          >
            View
          </Button>
        </Link>
      )
    },
  }
]

const StateContext = createContext<{
  state: any,
  setState: React.Dispatch<React.SetStateAction<any>>
}>({ state: false, setState: () => { } })

function GamesPage() {
  const { data: games } = api.games.getAll.useQuery()
  const { dark } = useContext(ThemeContext)
  const [onlyMyGames, setOnlyMyGames] = useState(false)
  const { data: session } = useSession()

  const shownGames = onlyMyGames ? games?.filter(g => g.player1?.email == session?.user.email) : games

  return (
    <Box padding={2} width='100%' height='100%'>
      <Paper sx={{ width: '100%', height: '100%' }}>
        <Box padding={0} height='100%'>
          <StateContext.Provider value={{ state: onlyMyGames, setState: setOnlyMyGames }}>
            <DataGrid
              columns={columns}
              rows={shownGames ?? []}
              disableRowSelectionOnClick
              pageSizeOptions={[5]}
              sx={graphSx(dark)}
              slots={{
                toolbar: CustomToolbar
              }}
            />
          </StateContext.Provider>
        </Box>
      </Paper>
    </Box>
  )
}

GamesPage.getLayout = function getLayout(page: React.ReactElement) {
  return (
    <Layout>
      {page}
    </Layout>
  )
}

GamesPage.auth = true

export default GamesPage
