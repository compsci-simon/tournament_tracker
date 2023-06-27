import { Box, Button, Modal, Paper, Stack, TextField, Typography } from "@mui/material"

import { useState } from "react";
import { DataGrid, GridColDef, GridToolbarContainer } from '@mui/x-data-grid'
import { api } from "~/utils/api";
import AddTournament from "~/components/AddTournament";
import Layout from "~/components/Layout";
import TabPanel from "~/components/TabPanel";

const userColumns: GridColDef[] = [
  { field: 'id', headerName: 'ID', width: 90 },
  {
    field: 'firstName',
    headerName: 'First name',
    width: 150,
    editable: true,
  },
  {
    field: 'lastName',
    headerName: 'Last name',
    width: 150,
    editable: true,
  },
  {
    field: 'rating',
    headerName: 'Rating',
    type: 'number',
    width: 110,
    editable: true,
  },
  {
    field: 'totalGames',
    headerName: 'Total Games',
    type: 'number',
    width: 160,
  },
  {
    field: 'deleteUser',
    headerName: 'Delete User',
    width: 150,
    renderCell(params: { row: { id: string } }) {
      const utils = api.useContext()
      const { mutate: deleteUserMutation } = api.user.deleteUser.useMutation({
        async onSuccess() {
          void await utils.user.getAll.invalidate()
        }
      })
      return <Button
        color="error"
        onClick={() => {
          deleteUserMutation({ id: params.row.id })
        }}
      >
        Delete
      </Button>
    },
  }
]

const tournamentColumns: GridColDef[] = [
  { field: 'id', headerName: 'ID', width: 90 },
  {
    field: 'name',
    headerName: 'Name',
    width: 150,
    editable: true,
  },
  {
    field: 'deleteUser',
    headerName: 'Delete User',
    width: 150,
    renderCell(params: { row: { id: string } }) {
      const utils = api.useContext()
      const { mutate: deleteTournamentMutation } = api.tournament.deleteTournament.useMutation({
        async onSuccess() {
          void await utils.tournament.getAll.invalidate()
        }
      })
      return <Button
        color="error"
        onClick={() => {
          deleteTournamentMutation({ id: params.row.id })
        }}
      >
        Delete
      </Button>
    },
  }
]

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
};

function CustomUserToolbar() {
  const [addModal, setAddModal] = useState(false)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const handleAddClose = () => { setAddModal(false) }
  const utils = api.useContext()
  const { mutate: addUserMutation } = api.user.addUser.useMutation({
    async onSuccess() {
      await utils.user.getAll.invalidate()
    }
  })

  return (
    <>
      <Modal
        open={addModal}
        onClose={handleAddClose}
      >
        <Box sx={style} >
          <Stack spacing={2}>
            <Typography id="modal-modal-title" variant="h6" component="h2">
              Add a user
            </Typography>
            <TextField
              label='First Name'
              value={firstName}
              autoComplete="off"
              onChange={e => setFirstName(e.target.value)}
            />
            <TextField
              label='Last Name'
              autoComplete="off"
              value={lastName}
              onChange={e => setLastName(e.target.value)}
            />
            <TextField
              label='Email'
              autoComplete="off"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
            <Button
              variant='outlined'
              onClick={() => {
                addUserMutation({ firstName, lastName, email })
                handleAddClose()
              }}
            >
              Submit
            </Button>
          </Stack>
        </Box>
      </Modal>
      <GridToolbarContainer>
        <Button onClick={() => {
          setFirstName('')
          setLastName('')
          setEmail('')
          setAddModal(true)
        }}> Add user </Button>
      </GridToolbarContainer>
    </>
  );
}

function CustomTournamentToolbar() {
  const [addModal, setAddModal] = useState(false)
  const handleAddClose = () => { setAddModal(false) }

  return (
    <>
      <Modal
        open={addModal}
        onClose={handleAddClose}
      >
        <Box sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 800,
          bgcolor: 'background.paper',
          border: '2px solid #000',
          boxShadow: 24,
          p: 4,
        }} >
          <Stack spacing={2}>
            <Typography id="modal-modal-title" variant="h4" component="h2">
              New tournament
            </Typography>
            <AddTournament handleSubmit={handleAddClose} handleCancel={handleAddClose} />
          </Stack>
        </Box>
      </Modal>
      <GridToolbarContainer>
        <Button onClick={() => {
          setAddModal(true)
        }}> New Tournament </Button>
      </GridToolbarContainer>
    </>
  );
}

export default function Page() {
  const { data: users } = api.user.getAll.useQuery()
  const { data: tournaments } = api.tournament.getAll.useQuery()
  const tabs = [
    {
      title: 'Users',
      content: <Paper >
        <DataGrid
          rows={users ?? []}
          columns={userColumns}
          disableRowSelectionOnClick
          slots={{
            toolbar: CustomUserToolbar
          }}
          pageSizeOptions={[5]}
          sx={{ border: 0 }}
        />
      </Paper>
    },
    {
      title: 'Tournaments',
      content: <Paper >
        <DataGrid
          rows={tournaments ?? []}
          columns={tournamentColumns}
          disableRowSelectionOnClick
          slots={{
            toolbar: CustomTournamentToolbar
          }}
          pageSizeOptions={[5]}
          sx={{ border: 0 }}
        />
      </Paper>
    }
  ]

  return <Box padding={4}>
    <TabPanel tabs={tabs} />
  </Box>
}

Page.getLayout = function getLayout(page: React.ReactElement) {
  return <Layout>
    {page}
  </Layout>
}