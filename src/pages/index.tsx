import { Box, Grid, Paper, Stack, Typography } from "@mui/material";
import { api } from "~/utils/api";
import ShowChartIcon from '@mui/icons-material/ShowChart';
import Layout from '../components/Layout'
import StraightenIcon from '@mui/icons-material/Straighten';
import SignalCellularAltIcon from '@mui/icons-material/SignalCellularAlt';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import MilitaryTechIcon from '@mui/icons-material/MilitaryTech';

const avatarWidth = '30px'

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
                  <SignalCellularAltIcon />
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
                    Top players of all time
                  </Typography>
                </Stack>
                {stats?.allTimeBest.map((rating, index) => {
                  return (
                    <Stack
                      key={`${index}`}
                      direction='row'
                      spacing={1}
                      alignItems='center'
                      justifyContent='space-between'
                    >
                      <img src={rating.avatar} style={{ width: '60px' }} />
                      <Typography
                        fontSize={20}
                      >
                        #{index + 1} {rating.name} - {rating.rating.toFixed(3)}
                      </Typography>
                    </Stack>
                  )
                })}
              </Stack>
            </Box>
          </Paper>
        </Grid>

        <Grid item md={6}>
          <Grid container spacing={2}>
            <Grid item md={6}>
              <Paper>
                <Box padding={2} minHeight={122}>
                  <Stack spacing={2}>
                    <Stack direction='row' spacing={1}>
                      <StraightenIcon />
                      <Typography variant='overline' sx={{ fontSize: '9px' }}>
                        Longest win streak
                      </Typography>
                    </Stack>
                    {stats?.longestStreak?.user ?
                      (
                        <Stack direction='row' alignItems='center' spacing={1}>
                          <img src={stats.longestStreak.user.avatar} style={{ width: '60px' }} />
                          <Typography variant="overline">{stats.longestStreak.user.name} - {stats.longestStreak.streak}</Typography>
                        </Stack>
                      ) : null
                    }
                  </Stack>
                </Box>
              </Paper>
            </Grid>

            <Grid item md={6}>
              <Paper>
                <Box padding={2} minHeight={122}>
                  <Stack spacing={2}>
                    <Stack direction='row' spacing={1}>
                      <AccessTimeIcon />
                      <Typography variant='overline' sx={{ fontSize: '9px' }}>Most recent game</Typography>
                    </Stack>

                    {stats?.mostRecentGame ? (
                      <Stack>
                        <Stack direction='row' alignItems='center' spacing={1}>
                          <img src={stats.mostRecentGame.player1!.avatar} style={{ width: avatarWidth }} />
                          <Typography variant="overline">{stats.mostRecentGame.player1!.name} - {stats.mostRecentGame.player1Points}</Typography>
                        </Stack>
                        <Stack direction='row' alignItems='center' spacing={1}>
                          <img src={stats.mostRecentGame.player2!.avatar} style={{ width: avatarWidth }} />
                          <Typography variant="overline">{stats.mostRecentGame.player2!.name} - {stats.mostRecentGame.player2Points}</Typography>
                        </Stack>
                      </Stack>
                    ) : <Typography>No games have been played</Typography>
                    }
                  </Stack>
                </Box>
              </Paper>
            </Grid>

            {stats?.latestTournamentWinner ? (
              <Grid item md={6}>
                <Paper>
                  <Box padding={2} minHeight={122}>
                    <Stack spacing={2}>
                      <Stack direction='row' spacing={1}>
                        <MilitaryTechIcon />
                        <Typography variant='overline' sx={{ fontSize: '9px' }}>
                          Last tournament winner
                        </Typography>
                      </Stack>

                      <Stack direction='row' alignItems='center' spacing={1}>
                        <img src={stats.latestTournamentWinner.winner!.avatar} style={{ width: '30px' }} />
                        <Typography variant="overline">{stats.latestTournamentWinner.winner!.name} won {stats.latestTournamentWinner.name}</Typography>
                      </Stack>
                    </Stack>
                  </Box>
                </Paper>
              </Grid>
            ) : null
            }
          </Grid>
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
