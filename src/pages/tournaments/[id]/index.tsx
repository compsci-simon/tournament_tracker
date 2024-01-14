import { Box, Button, Collapse, Container, Divider, List, ListItem, ListItemButton, Modal, Paper, Stack, TextField, Typography } from "@mui/material";
import { useRouter } from "next/router";
import { api } from "~/utils/api";
import { RouterOutputs } from "~/server/api/trpc"
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { Dispatch, SetStateAction, useContext, useEffect, useState } from "react";
import Layout from "~/components/Layout";
import { graphSx } from "~/utils/constants";
import { ThemeContext } from "../../_app";
import { useSession } from "next-auth/react";
import { ExpandLess, ExpandMore } from "@mui/icons-material";
import TabPanel from "~/components/TabPanel";
import { ElementType, groupItemsByKey } from "~/utils/utils";

import ReplayIcon from '@mui/icons-material/Replay';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import PanoramaFishEyeIcon from '@mui/icons-material/PanoramaFishEye';
import KnockoutTree from "~/components/KnockoutTree";
import { GameType, TournamentType } from "~/type";


type GameSubsetType = {
  id: string
  round: number
  player1: { name: string, email: string }
  player2: { name: string, email: string }
  winner: string
}

type RenderTablesProps = {
  tournament: TournamentType,
  setModalState: Dispatch<SetStateAction<boolean>>,
  setSelectedGame: Dispatch<SetStateAction<string | undefined>>,
  dark: boolean,
  userEmail: string
}

type ViewPropsType = {
  tournament: TournamentType
}

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
}

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
        renderCell(params) {
          return params.row.player1?.name
        },
      },
      {
        field: 'player2',
        headerName: 'Player',
        width: 150,
        renderCell(params) {
          return params.row.player2?.name
        },
      },
      {
        field: 'winner',
        headerName: 'Winner',
        width: 150
      },
      {
        field: 'selectWinner',
        headerName: 'Set Results',
        renderCell(params: { row: { id: string, player1: { email: string }, player2: { email: string } } }) {
          return <Button
            variant='outlined'
            onClick={() => {
              const newGameSelection = `${params?.row?.id ?? ''}`
              setSelectedGame(newGameSelection)
              setModalState(true)
            }}
            disabled={params.row.player1?.email != userEmail && params.row.player2?.email != userEmail}
          >
            Set
          </Button>
        },
      }
    ];
  }

const RenderTables = (
  {
    tournament,
    setModalState,
    setSelectedGame,
    dark,
    userEmail
  }: RenderTablesProps) => {

  const tournamentRounds: { index: number, games: GameSubsetType[] }[] = []
  const currentDate = new Date()
  const timeDiff = currentDate.getTime() - tournament.startDate.getTime()
  const currentRoundIndex = Math.floor(timeDiff / (1000 * 60 * 60 * 24 * (tournament.roundInterval === 'week' ? 7 : 1)))
  const [open, setOpen] = useState<boolean[]>([])
  const games = tournament.games.map(game => {
    let winner = 'To be played'
    if (game.player1Points > game.player2Points) {
      winner = game.player1.name
    } else if (game.player1Points < game.player2Points) {
      winner = game.player2.name
    } else if (game.player1Points == game.player2Points && game.player1Points > 0) {
      winner = 'Draw'
    }
    return {
      id: game.id,
      round: game.round,
      player1: game.player1,
      player2: game.player2,
      winner
    }
  })
  const selectRound = (roundIndex: number) => {
    setOpen(open.map((state, index) => {
      if (index != roundIndex) {
        return state
      } else {
        return !state
      }
    }))
  }

  useEffect(() => {
    const state = []
    for (let i = 0; i < tournament.numRounds; i++) {
      if (i == currentRoundIndex) {
        state.push(true)
      } else {
        state.push(false)
      }
    }
    setOpen(state)
  }, [tournament])

  for (let round = 0; round < tournament.numRounds; round++) {
    tournamentRounds.push({
      index: round,
      games: games.filter(game => game.round == round)
    })
  }

  return <Stack spacing={2}>
    {tournamentRounds.map(round => {
      return <Paper key={`${round.index}`}>
        <Box padding={2}>
          <Stack direction='row' justifyContent='space-between'>
            <span>
              Round {round.index}
            </span>
            <Button
              onClick={() => selectRound(round.index)}
            >
              {open[round.index] ? <ExpandLess /> : <ExpandMore />}
            </Button>
          </Stack>
          <Collapse in={open[round.index]} timeout="auto" unmountOnExit>
            <hr />
            <DataGrid
              columns={columns(setModalState, setSelectedGame, userEmail)}
              rows={round.games ?? []}
              disableRowSelectionOnClick
              pageSizeOptions={[5]}
              sx={graphSx(dark)}
            />
          </Collapse>
        </Box>
      </Paper>
    })}
  </Stack>
}

function RoundRobbinView({ tournament }: ViewPropsType) {
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
  const { data: tournamentLeaders } = api.tournament.tournamentLeaders.useQuery({
    id: tournament.id
  })
  const selectedGameData = tournament?.games.filter(game => game.id == selectedGame)[0]

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
          <Typography>{selectedGameData?.player1?.name ?? ''}</Typography>
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
          <Typography>{selectedGameData?.player2?.name ?? ''}</Typography>
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
      {tournament ? <RenderTables
        tournament={tournament}
        setModalState={setModalState}
        setSelectedGame={setSelectedGame}
        dark={dark}
        userEmail={session?.user.email}
      /> : null}
    </Stack>
  </Box>
}

function GroupStageTables({ tournament, games }: { tournament: TournamentType, games: GameType[] }) {
  const groups = groupItemsByKey<GameType>(games, 'group')
  const keys = Object.keys(groups)
  const router = useRouter()

  return <Box>
    <Stack spacing={3}>
      {keys.map(key => {
        const playersIds2d = groups[key].map(game => {
          return [game.player1Id, game.player2Id]
        })
        const playerIds = playersIds2d.reduce((acc, current) => {
          return acc.concat(current)
        }, [] as string[]).filter(p => p)
        const distinctPlayerIds = Array.from(new Set(playerIds))

        return <Stack key={key} spacing={1}>
          <h2>Group {key}</h2>
          <List disablePadding>
            <Divider />
            {distinctPlayerIds.map((id, index) => {
              const player = tournament.players?.filter(p => p.id == id)[0]
              const playerGames = tournament.games.filter(g => g.player1Id == id || g.player2Id == id)

              return <Box key={id}>
                <ListItem disablePadding>
                  <ListItemButton
                    onClick={() => {
                      router.push(`/tournaments/${tournament.id}/${id}`)
                    }}
                  >
                    <Stack direction='row' sx={{ width: '100%' }} justifyContent='space-between'>
                      <Stack direction='row' spacing={2} alignItems='center'>
                        <Typography variant='h5'>{index + 1}</Typography>
                        <img height={30} width={30} src={player.avatar} alt='avatar' />
                        <Typography variant="h5">
                          {player?.name}
                        </Typography>
                      </Stack>

                      <Stack direction='row' alignItems='center' spacing={1}>
                        {playerGames.map(game => {
                          const won = (game.player1Id == id && game.player1Points > game.player2Points)
                            || (game.player2Id == id && game.player2Points > game.player1Points)
                          const lost = (game.player1Id == id && game.player1Points < game.player2Points)
                            || (game.player2Id == id && game.player2Points < game.player1Points)
                          if (won) {
                            return <CheckCircleOutlineIcon key={game.id} sx={{ color: '#E4F1E4' }} />
                          } else if (lost) {
                            return <HighlightOffIcon key={game.id} sx={{ color: '#FDF2F2' }} />
                          } else {
                            return <PanoramaFishEyeIcon key={game.id} sx={{ color: '#D3D3D3' }} />
                          }
                        })}
                      </Stack>
                    </Stack>
                  </ListItemButton>
                </ListItem>
                <Divider />
              </Box>
            })}
          </List>
        </Stack>
      })}
    </Stack>
  </Box>
}

function MultiStageView({ tournament }: ViewPropsType) {

  const groupGames = tournament.games.filter(game => game.type == 'group')
  const knockoutGames = tournament.games.filter(game => game.type == 'knockout')

  const tabs = [
    {
      title: 'Table',
      content: <GroupStageTables tournament={tournament} games={groupGames} />
    },
    {
      title: 'Knockout',
      content: (
        <Box height={500} width={500}>
          <KnockoutTree games={knockoutGames} />
        </Box>
      )
    },
  ]

  return (
    <Container maxWidth='md'>
      <Box padding={2}>
        <Paper>
          <TabPanel tabs={tabs} />
        </Paper>
      </Box>
    </Container>
  )
}

export default function TournamentView() {
  const router = useRouter()
  const { query } = router
  const tournamentId = query.id ? Array.isArray(query.id) ? query.id[0] : query.id : ''
  const { data: tournament } = api.tournament.getTournament.useQuery({
    id: tournamentId
  })

  if (tournament?.type == 'round-robbin') {
    return <RoundRobbinView tournament={tournament} />
  } else if (tournament?.type == 'multi-stage') {
    return <MultiStageView tournament={tournament} />
  } else {
    return null
  }

}

TournamentView.getLayout = function getLayout(page: React.ReactElement) {
  return <Layout>
    {page}
  </Layout>
}