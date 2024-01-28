import { Box, Button, Paper, Typography } from "@mui/material"
import { DataGrid, GridColDef } from "@mui/x-data-grid"
import { useContext } from "react"
import Layout from "~/components/Layout"
import { api } from "~/utils/api"
import { ThemeContext } from "../_app"
import { graphSx } from "~/utils/constants"
import Link from "next/link"

const columns: GridColDef[] = [
  { field: 'id', headerName: 'ID' },
  {
    field: 'player1', headerName: 'Player 1',
    renderCell(params: { row: { player1: { name: string } } }) {
      return <span>{params.row.player1.name}</span>
    }
  },
  {
    field: 'player2', headerName: 'Player 2',
    renderCell(params: { row: { player2: { name: string } } }) {
      return <span>{params.row.player2.name}</span>
    }
  },
  {
    field: 'score', headerName: 'Score',
    renderCell(params: { row: { player1Points: number, player2Points: number } }) {
      return <span>{params.row.player1Points} - {params.row.player2Points}</span>
    }
  },
  {
    field: 'player1RatingChange', headerName: 'Player 1 rating Δ', width: 150,
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
    field: 'player2RatingChange', headerName: 'Player 2 rating Δ', width: 150,
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
    field: 'none',
    headerName: 'Delete game',
    width: 200,
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

function GamesPage() {
  const { data: games } = api.games.getAll.useQuery()
  const { dark } = useContext(ThemeContext)

  return <Box padding={2} width='100%' height='100%'>
    <Paper sx={{ width: '100%', height: '100%' }}>
      <Box padding={0} height='100%'>
        <DataGrid
          columns={columns}
          rows={games ?? []}
          disableRowSelectionOnClick
          pageSizeOptions={[5]}
          sx={graphSx(dark)}
        />
      </Box>
    </Paper>
  </Box>
}

GamesPage.getLayout = function getLayout(page: React.ReactElement) {
  return <Layout>
    {page}
  </Layout>
}

GamesPage.auth = true

export default GamesPage
