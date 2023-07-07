import { Box, Button, Modal, Paper, Stack, TextField, Typography } from "@mui/material";
import { useRouter } from "next/router";
import { api } from "~/utils/api";
import { RouterOutputs } from "~/server/api/trpc"
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { Dispatch, SetStateAction, useContext, useEffect, useState } from "react";
import ReplayIcon from '@mui/icons-material/Replay';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import Layout from "~/components/Layout";
import { graphSx } from "~/utils/constants";
import { ThemeContext } from "../_app";
import { useSession } from "next-auth/react";

type TournamentType = RouterOutputs['tournament']['getTournament']


const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
};

const columns: (
  setModalState: Dispatch<SetStateAction<boolean>>,
  setSelectedGame: Dispatch<SetStateAction<string | undefined>>,
  userEmail: string) => GridColDef[] = (setModalState, setSelectedGame, userEmail) => {

    return [
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
        width: 150
      },
      {
        field: 'selectWinner',
        headerName: 'Set Results',
        renderCell(params: { row: { id: string, players: { email: string }[] } }) {
          console.log(params.row)
          return <Button
            variant='outlined'
            onClick={() => {
              const newGameSelection = `${params?.row?.id ?? ''}`
              setSelectedGame(newGameSelection)
              setModalState(true)
            }}
            disabled={!params.row.players.map(p => p.email).includes(userEmail)}
          >
            Set
          </Button>
        },
      }
    ];
  }

const renderTables = (
  tournament: TournamentType,
  setModalState: Dispatch<SetStateAction<boolean>>,
  setSelectedGame: Dispatch<SetStateAction<string | undefined>>,
  dark: boolean,
  userEmail: string) => {

  let rounds = 0
  const tournamentRounds = []
  const currentDate = new Date()
  const timeDiff = currentDate.getTime() - tournament.startDate.getTime()
  const currentRoundIndex = Math.floor(timeDiff / (1000 * 60 * 60 * 24 * (tournament.roundInterval === 'week' ? 7 : 1)))
  const games = tournament!.games.map(game => {
    if ((game.round ?? 0) > rounds) {
      rounds++;
    }
    let winner = 'To be played'
    if (game.player1Points > game.player2Points) {
      winner = `${game.players[0]?.firstName ?? ''} ${game.players[0]?.lastName ?? ''}`
    } else if (game.player1Points < game.player2Points) {
      winner = `${game.players[1]?.firstName ?? ''} ${game.players[1]?.lastName ?? ''}`
    } else if (game.player1Points == game.player2Points && game.player1Points > 0) {
      winner = 'Draw'
    }
    return {
      id: game.id,
      round: game.round,
      player1: game.players[0] ? `${game.players[0].firstName} ${game.players[0].lastName}` : undefined,
      player2: game.players[1] ? `${game.players[1].firstName} ${game.players[1].lastName}` : undefined,
      players: game.players,
      winner
    }
  })

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
          Round {round.index} {currentRoundIndex}
          <hr />
          <DataGrid
            columns={columns(setModalState, setSelectedGame, userEmail)}
            rows={round.games ?? []}
            disableRowSelectionOnClick
            pageSizeOptions={[5]}
            sx={graphSx(dark)}
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
  const utils = api.useContext()
  const { dark } = useContext(ThemeContext)
  const { data: session } = useSession()
  const { mutate: updatePointsMutation } = api.tournament.setGamePoints.useMutation({
    async onSuccess() {
      await utils.tournament.getTournament.invalidate()
    }
  })
  const resetScores = () => {
    setPlayer1Points(0)
    setPlayer2Points(0)
    updatePointsMutation({ gameId: selectedGame ?? '', player1Points: 0, player2Points: 0 })
  }
  const tournamentId = query.id ? Array.isArray(query.id) ? query.id[0] : query.id : ''
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
          <Typography>{`${selectedGameData?.players[0]?.firstName ?? ''} ${selectedGameData?.players[0]?.lastName ?? ''}`}</Typography>
          <TextField
            label='Points'
            type='number'
            value={player1Points}
            onChange={e => {
              if (parseInt(e.target.value) >= 0) {
                setPlayer1Points(parseInt(e.target.value))
              }
            }}
          />
          <Typography>{`${selectedGameData?.players[1]?.firstName ?? ''} ${selectedGameData?.players[1]?.lastName ?? ''}`}</Typography>
          <TextField
            label='Points'
            type='number'
            value={player2Points}
            onChange={e => {
              if (parseInt(e.target.value) >= 0) {
                setPlayer2Points(parseInt(e.target.value))
              }
            }}
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
      {tournamentData ? renderTables(tournamentData, setModalState, setSelectedGame, dark, session.user.email) : null}
    </Stack>
  </Box>
}

TournamentView.getLayout = function getLayout(page: React.ReactElement) {
  return <Layout>
    {page}
  </Layout>
}