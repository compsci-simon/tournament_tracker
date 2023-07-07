import { Box, Button, Paper, Stack, Typography } from '@mui/material'
import Layout from '../../components/Layout'
import LineChart from '../../components/LineChart'
import { api } from '~/utils/api'
import { useRouter } from 'next/router'
import { enqueueSnackbar } from 'notistack'
import { useSession } from 'next-auth/react'
import { useContext } from 'react'
import { ThemeContext } from '../_app'
import { options } from '~/utils/constants'


export default function TournamentsPage() {
  const utils = api.useContext()
  const { data: tournaments } = api.tournament.tournamentsStats.useQuery()
  const { mutate: joinTournamentMutation } = api.tournament.joinTournament.useMutation({
    onSuccess() {
      utils.tournament.tournamentsStats.invalidate()
      enqueueSnackbar('Joined tournament', { variant: 'success' })
    },
    onError() {
      enqueueSnackbar('Failed to join tournament', { variant: 'error' })
    }
  })
  const { mutate: leaveTournamentMutation } = api.tournament.leaveTournament.useMutation({
    onSuccess() {
      utils.tournament.tournamentsStats.invalidate()
      enqueueSnackbar('Left tournament', { variant: 'success' })
    },
    onError() {
      enqueueSnackbar('Failed to leave tournament', { variant: 'error' })
    }
  })
  const { data: session } = useSession()
  const router = useRouter()
  const currentDate = new Date()
  const { dark } = useContext(ThemeContext)

  return <Box padding={4}>
    {tournaments?.map(tournament => {
      const started = tournament.startDate <= currentDate
      const joinTournament = () => {
        joinTournamentMutation({ tournamentId: tournament.id })
      }
      const leaveTournament = () => {
        leaveTournamentMutation({ tournamentId: tournament.id })
      }

      const ButtonToShow = () => {
        const signedUpToTournament = tournament.players.map(p => p.email).includes(session?.user.email ?? '')
        if (!signedUpToTournament) {
          return <>
            <Typography fontSize={12}>You are <b>not</b> set to take part in this tournament!</Typography>
            <Box>
              <Button
                variant='outlined'
                onClick={joinTournament}
              >
                Join
              </Button>
            </Box>
          </>
        }
        return <>
          <Typography fontSize={12}>You are set to take part in this tournament!</Typography>
          <Box>
            <Button
              variant='outlined'
              onClick={leaveTournament}
              color='error'
            >
              Leave tournament
            </Button>
          </Box>
        </>
      }

      const startingSoonInfo = () => {
        if (started) return null
        return <>
          <Typography variant='h5'>
            Starting: {tournament.startDate.toDateString()}
          </Typography>
          <Box display='inline-block' padding={2}>
            <Paper elevation={0} sx={{ display: 'inline-block' }}>
              <Box padding={2}>
                <table>
                  <tr>
                    <th colSpan={2}>Signed up players</th>
                  </tr>
                  {tournament.players.map(player => {
                    if (player.email == session.user.email) {
                      return <tr><td colSpan={2}><em>You</em></td></tr>
                    }
                    return <tr><td>{player.firstName}</td><td>{player.lastName}</td></tr>
                  })}
                </table>
              </Box>
            </Paper>
          </Box>
        </>
      }

      return <Paper key={tournament.id}>
        <Box padding={2}>
          <Stack spacing={1}>
            <Typography variant='h3'>
              {tournament.name}
            </Typography>
            {
              startingSoonInfo()
            }
            {
              started ?
                <>
                  <Box height={300}>
                    {
                      tournament.chartData ?
                        <LineChart options={options(dark)} data={tournament.chartData} />
                        : null
                    }
                  </Box>
                  <Box>
                    <Button
                      variant='outlined'
                      onClick={() => { void router.push(`/tournaments/${tournament.id}`).then((r) => { r }).catch(e => console.log(e)) }}
                    >
                      View
                    </Button>
                  </Box>
                </>
                : ButtonToShow()
            }
          </Stack>
        </Box>
      </Paper>
    })}
  </Box>
}

TournamentsPage.getLayout = function getLayout(page: React.ReactElement) {
  return <Layout>
    {page}
  </Layout>
}

TournamentsPage.auth = true
