import { RouterOutputs } from "~/server/api/trpc"
import TransferList from "./TransferList"
import { useEffect, useState } from "react"
import { api } from "~/utils/api"
import { Button, Stack, TextField, Typography } from "@mui/material"

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
  const utils = api.useContext()
  const { mutate: createTournament } = api.tournament.createTournament.useMutation({
    onSuccess() {
      utils.tournament.getAll.invalidate()
      setLeft([...left, ...right])
      setRight([])
      setTournamentName('')
    }
  })

  useEffect(() => {
    setLeft(users ?? [])
  }, [users])

  return <Stack spacing={2}>
    <TextField
      label='Tournament name'
      value={tournamentName}
      onChange={e => setTournamentName(e.target.value)}
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
          const playerIds = right.map(user => user.id)
          createTournament({ name: tournamentName, playerIds })
          handleSubmit()
        }}
      >
        Create
      </Button>
    </Stack>

  </Stack>
}