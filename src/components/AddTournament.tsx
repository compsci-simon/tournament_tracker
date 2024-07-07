import { useState } from "react"
import { api } from "~/utils/api"
import { Box, Button, Checkbox, FormControl, FormControlLabel, FormLabel, InputLabel, MenuItem, Radio, RadioGroup, Select, Stack, TextField } from "@mui/material"
import React from "react"
import dayjs, { Dayjs } from 'dayjs'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider, MobileDateTimePicker } from "@mui/x-date-pickers"
import { enqueueSnackbar } from "notistack";
import { stringToIcon } from "~/pages/admin"

type AddTournamentProps = {
  handleSubmit: () => void
  handleCancel: () => void
}

export default function AddTournament({ handleSubmit, handleCancel }: AddTournamentProps) {
  const [selectedSportId, setSelectedSportId] = useState<null | string>(null)
  const [tournamentName, setTournamentName] = useState('')
  const [startDate, setStartDate] = React.useState<Dayjs | null>(dayjs());
  const [tournamentType, setTournamentType] = useState('multi-stage')
  const { data: sports, isLoading } = api.sports.all.useQuery()
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

  if (isLoading) return null

  return (
    <Stack spacing={2}>
      <FormControl>
        <Select size='medium' value={sports?.find(s => s.id == selectedSportId)} onChange={(e) => setSelectedSportId(e.target.value as string)}>
          {sports!.map(sport => (
            <MenuItem value={sport.id}>
              <Stack direction='row' spacing={1} alignItems='center'>
                <Box>
                  {stringToIcon(sport.icon)}
                </Box>
                <Box>
                  {sport.name}
                </Box>
              </Stack>
            </MenuItem>
          ))}
        </Select>
      </FormControl>
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
          disabled={!selectedSportId || !tournamentName || !startDate || startDate! <= dayjs()}
          variant="outlined"
          onClick={() => {
            createTournament({
              name: tournamentName,
              startDate: startDate?.toDate() ?? new Date(),
              tournamentType,
              sportId: selectedSportId!
            })
            handleSubmit()
          }}
        >
          Create
        </Button>
      </Stack>
    </Stack>
  )
}