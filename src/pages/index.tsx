import { Box, Grid, Paper, Stack, Typography } from "@mui/material";
import { api } from "~/utils/api";
import ShowChartIcon from '@mui/icons-material/ShowChart';
import Layout from '../components/Layout'
import LineChart from "~/components/LineChart";

const options = {
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    x: {
      display: false
    },
    y: {
      display: false
    },
  },
  plugins: {
    legend: {
      display: false,
      position: 'top' as const
    },
    title: {
      display: false,
      text: '',
      position: 'top' as const
    },
  }
}

export default function HomePage() {
  const { data: stats } = api.tournament.overviewStats.useQuery()

  return (
    <Box padding={4}>
      <Grid container spacing={2}>

        <Grid item md={3}>
          <Paper>
            <Box padding={2} minHeight={122}>
              <Stack alignItems='center' spacing={2}>
                <Typography variant='overline'>
                  Total Matches
                </Typography>
                <Typography variant='h4'>
                  {stats?.numGames}
                </Typography>
              </Stack>
            </Box>
          </Paper>
        </Grid>

        <Grid item md={3}>
          <Paper>
            <Box padding={2} minHeight={122}>
              <Stack alignItems='center' spacing={2}>
                <Typography variant='overline'>
                  Total Players
                </Typography>
                <Typography variant='h4'>
                  {stats?.numPlayers}
                </Typography>
              </Stack>
            </Box>
          </Paper>
        </Grid>

        <Grid item md={3}>
          <Paper>
            <Box padding={2} minHeight={122}>
              <Stack spacing={2}>
                <Stack direction='row' spacing={1}>
                  <ShowChartIcon />
                  <Typography variant='overline' sx={{ fontSize: '9px' }}>
                    Most games
                  </Typography>
                </Stack>
                <Typography variant='overline'>
                  {stats?.mostGames.player} - {stats?.mostGames.value}
                </Typography>
              </Stack>
            </Box>
          </Paper>
        </Grid>

        <Grid item md={3}>
          <Paper>
            <Box padding={2} minHeight={122}>
              <Stack spacing={2}>
                <Stack direction='row' spacing={1}>
                  <ShowChartIcon />
                  <Typography variant='overline' sx={{ fontSize: '9px' }}>
                    Rise of the week
                  </Typography>
                </Stack>
                <Typography variant='overline'>
                  {stats?.biggestGainer?.name} - {stats?.biggestGainer?.increase.toFixed(3)}
                </Typography>
              </Stack>
            </Box>
          </Paper>
        </Grid>

        <Grid item md={6}>
          <Paper>
            <Box padding={2} minHeight={400}>
              <Stack spacing={2}>
                <Stack direction='row' spacing={1}>
                  <ShowChartIcon />
                  <Typography variant='overline' sx={{ fontSize: '9px' }}>
                    Top players
                  </Typography>
                </Stack>
                {stats?.playerRankingHistories.map((playerHistory, index) => {
                  if (index > 4) {
                    return null
                  }
                  const data = {
                    labels: playerHistory.history.map(x => ''),
                    datasets: [
                      {
                        label: '',
                        data: playerHistory.history,
                        borderColor: '',
                        backgroundColor: '',
                        tension: 0.4,
                        pointRadius: 0.1
                      }
                    ]
                  }
                  return <Stack
                    key={`${index}`}
                    direction='row'
                    spacing={1}
                    alignItems='center'
                    justifyContent='space-between'
                  >
                    <img src={playerHistory.avatar} style={{ width: '60px' }} />
                    <Typography
                      fontSize={20}
                    >
                      #{index + 1} {playerHistory.name} - {playerHistory.current.toFixed(3)}
                    </Typography>
                    <Paper elevation={0} variant='outlined'>
                      <Box height={70} width={200} padding={1}>
                        <LineChart options={options} data={data} />
                      </Box>
                    </Paper>
                  </Stack>
                })}
              </Stack>
            </Box>
          </Paper>
        </Grid>

      </Grid>
    </Box>
  );
}

HomePage.getLayout = function getLayout(page: React.ReactElement) {
  return <Layout>
    {page}
  </Layout>
}

HomePage.auth = true
