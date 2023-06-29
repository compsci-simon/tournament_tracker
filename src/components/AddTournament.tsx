import { RouterOutputs } from "~/server/api/trpc"
import TransferList from "./TransferList"
import { useEffect, useState } from "react"
import { api } from "~/utils/api"
import { Box, Button, Checkbox, FormControlLabel, InputLabel, MenuItem, Select, Stack, TextField, Typography } from "@mui/material"
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import React from "react"
import dayjs, { Dayjs } from 'dayjs'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from "@mui/x-date-pickers"

type UserType = RouterOutputs['user']['getAll']
type AddTournamentProps = {
  handleSubmit: () => void
  handleCancel: () => void
}

export default function AddTournament({ handleSubmit, handleCancel }: AddTournamentProps) {
  const { data: users } = api.user.getAll.useQuery()
  const [left, setLeft] = useState<UserType>([])
  const [right, setRight] = useState<UserType>([])
  const [tournamentName, setTournamentName] = useState('')
  const [startDate, setStartDate] = React.useState<Dayjs | null>(dayjs());
  const [roundInterval, setRoundInterval] = useState<string>('week')
  const [emailReminders, setEmailReminders] = useState(false)
  const utils = api.useContext()
  const { mutate: createTournament } = api.tournament.createTournament.useMutation({
    async onSuccess() {
      void await utils.tournament.getAll.invalidate()
      setLeft([...left, ...right])
      setRight([])
      setTournamentName('')
    }
  })

  useEffect(() => {
    setLeft(users ?? [])
  }, [users])


  return <Stack spacing={2}>
    <Box>
      <TextField
        label='Tournament name'
        value={tournamentName}
        onChange={e => setTournamentName(e.target.value)}
      />
    </Box>
    <Box>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <DatePicker label="Tournament start date" value={startDate} onChange={newVal => setStartDate(newVal)} />
      </LocalizationProvider>
    </Box>
    <Box>
      <InputLabel sx={{ marginBottom: '5px' }}>Round Frequency</InputLabel>
      <Select
        label='Round Frequency'
        value={roundInterval}
        onChange={e => setRoundInterval(e.target.value)}
      >
        <MenuItem value='day'>Daily</MenuItem>
        <MenuItem value='week'>Weekly</MenuItem>
      </Select>
    </Box>
    <FormControlLabel
      control={<Checkbox
        value={emailReminders}
        onChange={e => setEmailReminders(e.target.checked)}
      />}
      label="Email reminders"
    />
    <Stack spacing={1}>
      <Typography variant="h5">
        Add players to tournament
      </Typography>
      <TransferList left={left} setLeft={setLeft} right={right} setRight={setRight} />
    </Stack>
    <Stack direction='row' spacing={1} justifyContent='end'>
      <Button
        color='error'
        variant='outlined'
        onClick={handleCancel}
      >
        Cancel
      </Button>
      <Button
        variant="outlined"
        onClick={() => {
          createTournament({
            name: tournamentName,
            playerIds: right.map(user => user.id),
            emailReminders,
            startDate: startDate?.toDate() ?? new Date(),
            roundInterval
          })
          handleSubmit()
        }}
      >
        Create
      </Button>
    </Stack>

  </Stack>
}