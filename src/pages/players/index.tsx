import { Box, List, ListItem, ListItemButton, Paper, Stack, TextField, Typography } from "@mui/material"
import { useState } from "react"
import Layout from "~/components/Layout"
import { api } from "~/utils/api"
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import LineChart from "~/components/LineChart";
import { colors } from "~/utils/constants";

const options = {
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    x: {
      display: false
    },
  },
  plugins: {
    legend: {
      position: 'top' as const,
    },
    title: {
      display: true,
      text: 'Elo history',
    },
  },
}

const playerInfo = (playerId: string, name: string) => {
  const { data: user } = api.ratings.playerGames.useQuery({
    playerId
  })

  return <Stack height='100%'>
    <Stack spacing={2}>
      <Typography variant="overline">Player info</Typography>

      <Stack spacing={10} direction='row'>
        <Stack spacing={10}>
          <Stack spacing={2}>
            <AccountCircleIcon sx={{ width: 200, height: 200, color: '#808080' }} />
            <Box>
              <Stack spacing={1} alignItems='center' direction='row'>
                <LocalFireDepartmentIcon sx={{ width: 30, height: 30, color: '#FFA500' }} />
                <Typography fontSize={24}>{user?.currentScore}</Typography>
              </Stack>
            </Box>
          </Stack>
        </Stack>

        <Stack spacing={2}>
          <Typography fontSize={20}>{name}</Typography>
          <Stack spacing={1}>
            <Stack direction='row' alignItems='center' spacing={1}>
              <Typography variant="h6" fontSize={18}>Streak:</Typography>
              <Typography variant="body1" fontSize={18}> {user?.streak}</Typography>
            </Stack>
            <Stack direction='row' alignItems='center' spacing={1}>
              <Typography variant="h6" fontSize={18}>Total games:</Typography>
              <Typography variant="body1" fontSize={18}> {user?.totalGames}</Typography>
            </Stack>
          </Stack>
        </Stack>
      </Stack>

    </Stack>
    <hr />
    <Box flexGrow={2} width='100%'>
      <LineChart
        options={options}
        data={{
          labels: user?.ratings?.map(rating => rating.date.toUTCString()) ?? [],
          datasets: [{
            label: '',
            data: user?.ratings?.map(rating => rating.rating) ?? [],
            borderColor: colors[1]?.borderColor,
            backgroundColor: colors[1]?.backgroundColor,
            // tension: 0.4,
          }],
        }}
      />
    </Box>
  </Stack>
}
export default function Page() {
  const { data: users } = api.user.getAll.useQuery()
  const [selectedUser, setSelectedUser] = useState<{ id: string, firstName: string, lastName: string } | undefined>()

  return <Box height='100%' padding={2}>
    <Stack className="h-100" direction='row' spacing={2}>
      <Box>
        <Paper className="h-100">
          <Box padding={2}>
            <Stack>
              <Typography variant='overline'>
                Players
              </Typography>
              <TextField
                label='Find Player'
                variant='standard'
              />
              <List disablePadding>
                {users?.map(user => {
                  return <ListItemButton
                    selected={selectedUser?.id == user.id}
                    onClick={() => setSelectedUser(user)}
                    key={user.id}
                  >
                    <ListItem disablePadding>
                      {user.firstName} {user.lastName}
                    </ListItem>
                  </ListItemButton>
                })}
              </List>
            </Stack>
          </Box>
        </Paper>
      </Box>
      <Box flexGrow={2}>
        <Paper className="h-100">
          <Box padding={2} height='100%'>
            {playerInfo(selectedUser?.id ?? '', `${selectedUser?.firstName ?? ''} ${selectedUser?.lastName ?? ''}`)}
          </Box>
        </Paper>
      </Box>
    </Stack>
  </Box>
}

Page.getLayout = function getLayout(page: React.ReactElement) {
  return <Layout>
    {page}
  </Layout>
}