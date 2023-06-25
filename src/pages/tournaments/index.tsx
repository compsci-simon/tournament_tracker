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

export default function Page() {
  const { data: tournaments } = api.tournament.tournamentsStats.useQuery()
  const router = useRouter()

  return <Box padding={4}>
    {tournaments?.map(tournament => {
      return <Paper key={tournament.id}>
        <Box padding={2}>
          <Stack spacing={1}>
            <Typography variant='h6'>
              {tournament.name}
            </Typography>
            <Box>
              <Button
                variant='outlined'
                onClick={() => router.push(`/tournaments/${tournament.id}`)}
              >
                View
              </Button>
            </Box>
            <Box height={300}>
              {
                tournament.chartData ?
                  <LineChart options={options} data={tournament.chartData} />
                  : null
              }
            </Box>
          </Stack>
        </Box>
      </Paper>
    })}
  </Box>
}

Page.getLayout = function getLayout(page: React.ReactElement) {
  return <Layout>
    {page}
  </Layout>
}