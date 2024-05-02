import { useState } from "react"
import { api } from "~/utils/api"
import { Box, Button, Checkbox, FormControl, FormControlLabel, FormLabel, InputLabel, MenuItem, Radio, RadioGroup, Select, Stack, TextField } from "@mui/material"
import React from "react"
import dayjs, { Dayjs } from 'dayjs'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider, MobileDateTimePicker } from "@mui/x-date-pickers"
import { enqueueSnackbar } from "notistack";

type AddTournamentProps = {
  handleSubmit: () => void
  handleCancel: () => void
}

export default function AddTournament({ handleSubmit, handleCancel }: AddTournamentProps) {
  const [tournamentName, setTournamentName] = useState('')
  const [startDate, setStartDate] = React.useState<Dayjs | null>(dayjs());
  const [roundInterval, setRoundInterval] = useState<string>('week')
  const [emailReminders, setEmailReminders] = useState(false)
  const [tournamentType, setTournamentType] = useState('multi-stage')
  const utils = api.useContext()
  const { mutate: createTournament } = api.tournament.createTournament.useMutation({
    async onSuccess() {
      void await utils.tournament.getAll.invalidate()
      setTournamentName('')
      enqueueSnackbar('Created tournament', { variant: 'success' })
    },
    onError() {
      enqueueSnackbar('Failed to create tournament', { variant: 'error' })
    }
  })
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setTournamentType((event.target as HTMLInputElement).value);
  };

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
        <MobileDateTimePicker label="Tournament start date" defaultValue={startDate} onChange={newVal => setStartDate(newVal)} />
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
    <FormControl>
      <FormLabel>Tournament Type</FormLabel>
      <RadioGroup
        defaultValue="multi-stage"
        name="radio-buttons-group"
        value={tournamentType}
        onChange={handleChange}
      >
        <FormControlLabel value="multi-stage" control={<Radio />} label="Multi stage" />
        <FormControlLabel value="round-robbin" control={<Radio />} label="Round robbin" />
      </RadioGroup>
    </FormControl>
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
            emailReminders,
            startDate: startDate?.toDate() ?? new Date(),
            roundInterval,
            tournamentType
          })
          handleSubmit()
        }}
      >
        Create
      </Button>
    </Stack>

  </Stack>
}