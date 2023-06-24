import { Box, Button, Container, FormGroup, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Modal, Paper, Stack, TextField, Typography } from "@mui/material"

import PeopleIcon from '@mui/icons-material/People';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import { useState } from "react";
import { DataGrid, GridColDef, GridRowSelectionModel, GridToolbarColumnsButton, GridToolbarContainer, GridToolbarFilterButton, GridValueGetterParams } from '@mui/x-data-grid'
import { api } from "~/utils/api";
import AddTournament from "~/components/AddTournament";

const columns: GridColDef[] = [
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
    renderCell(params) {
      const utils = api.useContext()
      const { mutate: deleteUserMutation } = api.user.deleteUser.useMutation({
        onSuccess() {
          utils.user.getAll.invalidate()
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

const style = {
  position: 'absolute' as 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
};

function CustomToolbar() {
  const [addModal, setAddModal] = useState(false)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const handleAddClose = () => { setAddModal(false) }
  const utils = api.useContext()
  const { mutate: addUserMutation } = api.user.addUser.useMutation({
    onSuccess() {
      utils.user.getAll.invalidate()
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
            <Button
              variant='outlined'
              onClick={() => {
                addUserMutation({ firstName, lastName })
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
          setAddModal(true)
        }}> Add user </Button>
      </GridToolbarContainer>
    </>
  );
}

export default () => {
  const [selectedItem, setSelectedItem] = useState<'users' | 'events'>('events')
  const { data: users } = api.user.getAll.useQuery()

  return <Container sx={{ mt: '50px', height: '100%' }}>
    <Stack direction='row' spacing={2} sx={{ height: '100%' }}>
      <Paper sx={{ height: '100%' }}>
        <List>
          <ListItem
            disablePadding
            onClick={() => setSelectedItem('users')}
          >
            <ListItemButton selected={selectedItem == 'users'}>
              <ListItemIcon>
                <PeopleIcon />
              </ListItemIcon>
              <ListItemText primary='Users' />
            </ListItemButton>
          </ListItem>
          <ListItem
            disablePadding
            onClick={() => setSelectedItem('events')}
          >
            <ListItemButton selected={selectedItem == 'events'}>
              <ListItemIcon>
                <EmojiEventsIcon />
              </ListItemIcon>
              <ListItemText primary='Events' />
            </ListItemButton>
          </ListItem>
        </List>
      </Paper>
      <Paper sx={{ width: '100%', padding: '40px' }}>
        {
          selectedItem === 'users' ?
            <DataGrid
              rows={users ?? []}
              columns={columns}
              disableRowSelectionOnClick
              slots={{
                toolbar: CustomToolbar
              }}
            />
            : <AddTournament />
        }
      </Paper>
    </Stack>
  </Container>
}