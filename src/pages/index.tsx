import { Box, Grid, Paper, Stack, Typography } from "@mui/material";
import { api } from "~/utils/api";
import ShowChartIcon from '@mui/icons-material/ShowChart';
import Layout from '../components/Layout'

export default function Page() {
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
                  Moore Laura
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
              </Stack>
            </Box>
          </Paper>
        </Grid>

      </Grid>
    </Box>
  );
}

Page.getLayout = function getLayout(page: React.ReactElement) {
  return <Layout>
    {page}
  </Layout>
}
