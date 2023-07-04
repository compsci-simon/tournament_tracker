import { Box, Button, Paper, Stack, Typography } from '@mui/material'
import Layout from '../../components/Layout'
import LineChart from '../../components/LineChart'
import { api } from '~/utils/api'
import { useRouter } from 'next/router'

const options = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top' as const,
    },
    title: {
      display: true,
      text: 'Player scores',
    },
  },
}

export default function TournamentsPage() {
  const { data: tournaments } = api.tournament.tournamentsStats.useQuery()
  const router = useRouter()
  const currentDate = new Date()

  return <Box padding={4}>
    {tournaments?.map(tournament => {
      const started = tournament.startDate <= currentDate
      return <Paper key={tournament.id}>
        <Box padding={2}>
          <Stack spacing={1}>
            <Typography variant='h3'>
              {tournament.name}
            </Typography>
            {
              !started ?
                <Typography variant='h5'>
                  Starting: {tournament.startDate.toDateString()}
                </Typography>
                : null
            }
            {
              started ?
                <>
                  <Box height={300}>
                    {
                      tournament.chartData ?
                        <LineChart options={options} data={tournament.chartData} />
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
                : <Box>
                  <Button variant='outlined'>Join</Button>
                </Box>
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
