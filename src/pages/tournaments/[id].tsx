import { Box, Button, Modal, Paper, Stack, TextField, Typography } from "@mui/material";
import { useRouter } from "next/router";
import { api } from "~/utils/api";
import { RouterOutputs } from "~/server/api/trpc"
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import ReplayIcon from '@mui/icons-material/Replay';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import Layout from "~/components/Layout";

type TournamentType = RouterOutputs['tournament']['getTournament']


const style = {
  position: 'absolute' as 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
};


const renderTables = (
  tournament: TournamentType,
  setModalState: Dispatch<SetStateAction<boolean>>,
  setSelectedGame: Dispatch<SetStateAction<string | undefined>>) => {
  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 90 },
    {
      field: 'player1',
      headerName: 'Player',
      width: 150,
    },
    {
      field: 'player2',
      headerName: 'Player',
      width: 150,
    },
    {
      field: 'winner',
      headerName: 'Winner',
    },
    {
      field: 'selectWinner',
      headerName: 'Set Results',
      renderCell(params) {
        return <Button
          onClick={() => {
            setSelectedGame(params.row.id)
            setModalState(true)
          }}
        >
          Set
        </Button>
      },
    }
  ];
  let rounds = 0
  const games = tournament!.games.map(game => {
    if (game.round > rounds) {
      rounds++;
    }
    let winner = 'To be played'
    if (game.player1Points > game.player2Points) {
      winner = `${game.players[0]?.firstName} ${game.players[0]?.lastName}`
    } else if (game.player1Points < game.player2Points) {
      winner = `${game.players[1]?.firstName} ${game.players[1]?.lastName}`
    } else if (game.player1Points == game.player2Points && game.player1Points > 0) {
      winner = 'Draw'
    }
    return {
      id: game.id,
      round: game.round,
      player1: game.players[0] ? `${game.players[0].firstName} ${game.players[0].lastName}` : undefined,
      player2: game.players[1] ? `${game.players[1].firstName} ${game.players[1].lastName}` : undefined,
      winner
    }
  })
  const tournamentRounds = []
  for (let round = 0; round < rounds + 1; round++) {
    tournamentRounds.push({
      index: round,
      games: games.filter(game => game.round == round)
    })
  }

  return <Stack spacing={2}>
    {tournamentRounds.map(round => {
      return <Paper key={`${round.index}`}>
        <Box padding={2}>
          Round {round.index}
          <hr />
          <DataGrid
            columns={columns}
            rows={round.games ?? []}
            disableRowSelectionOnClick
            pageSizeOptions={[5]}
          />
        </Box>
      </Paper>
    })}
  </Stack>
}

export default function TournamentView() {
  const router = useRouter()
  const { query } = router
  const [modalState, setModalState] = useState(false)
  const [selectedGame, setSelectedGame] = useState<string | undefined>()
  const [player1Points, setPlayer1Points] = useState(0)
  const [player2Points, setPlayer2Points] = useState(0)
  const [leaderboard, setLeaderboard] = useState({ first: '', second: '', third: '' })
  const utils = api.useContext()
  const { mutate: updatePointsMutation } = api.tournament.setGamePoints.useMutation({
    onSuccess() {
      utils.tournament.getTournament.invalidate()
    }
  })
  const resetScores = () => {
    setPlayer1Points(0)
    setPlayer2Points(0)
    updatePointsMutation({ gameId: selectedGame ?? '', player1Points, player2Points })
  }
  let tournamentId = query.id
  if (!tournamentId) {
    tournamentId = ''
  }
  if (tournamentId && Array.isArray(tournamentId)) {
    tournamentId = tournamentId[0]!
  }
  const { data: tournamentData } = api.tournament.getTournament.useQuery({
    id: tournamentId
  })
  const { data: tournamentLeaders } = api.tournament.tournamentLeaders.useQuery({
    id: tournamentId
  })
  const selectedGameData = tournamentData?.games.filter(game => game.id == selectedGame)[0]

  useEffect(() => {
    setPlayer1Points(selectedGameData?.player1Points ?? -1)
    setPlayer2Points(selectedGameData?.player2Points ?? -1)
  }, [selectedGame])

  return <Box padding={4}>
    <Modal
      open={modalState}
      onClose={() => setModalState(false)}
    >
      <Box sx={style}>
        <Stack spacing={2}>
          <Typography>{`${selectedGameData?.players[0]?.firstName} ${selectedGameData?.players[0]?.lastName}`}</Typography>
          <TextField
            label='Points'
            type='number'
            value={player1Points}
            onChange={e => setPlayer1Points(parseInt(e.target.value))}
          />
          <Typography>{`${selectedGameData?.players[1]?.firstName} ${selectedGameData?.players[1]?.lastName}`}</Typography>
          <TextField
            label='Points'
            type='number'
            value={player2Points}
            onChange={e => setPlayer2Points(parseInt(e.target.value))}
          />
          <Stack direction='row' spacing={2}>
            <Button
              variant="outlined"
              onClick={() => {
                updatePointsMutation({ gameId: selectedGame ?? '', player1Points, player2Points })
                setModalState(false)
              }}
            >
              Submit
            </Button>
            <Button color='warning' variant="outlined" endIcon={<ReplayIcon />} onClick={resetScores}>
              Reset
            </Button>
          </Stack>
        </Stack>
      </Box>
    </Modal>
    <Stack spacing={2}>
      <Paper>
        <Box padding={2}>
          <Stack direction='row' alignItems='center' spacing={1}>
            <EmojiEventsIcon fontSize="large" />
            <Typography variant="h6">
              Tournament leaders
            </Typography>
          </Stack>
          <Stack>
            <Typography variant='overline'>
              First - {tournamentLeaders?.first ?? ''}
            </Typography>
            <Typography variant='overline'>
              Second - {tournamentLeaders?.second ?? ''}
            </Typography>
            <Typography variant='overline'>
              Third - {tournamentLeaders?.third ?? ''}
            </Typography>
          </Stack>
        </Box>
      </Paper>
      {tournamentData ? renderTables(tournamentData, setModalState, setSelectedGame) : null}
    </Stack>
  </Box>
}

TournamentView.getLayout = function getLayout(page: React.ReactElement) {
  return <Layout>
    {page}
  </Layout>
}