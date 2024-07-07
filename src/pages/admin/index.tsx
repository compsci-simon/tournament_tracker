import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, InputLabel, MenuItem, Modal, Paper, Select, Stack, TextField, Typography } from "@mui/material"

import { useState } from "react";
import { DataGrid, GridColDef, GridToolbarContainer } from '@mui/x-data-grid'
import { api } from "~/utils/api";
import AddTournament from "~/components/AddTournament";
import Layout from "~/components/Layout";
import TabPanel from "~/components/TabPanel";
import { FaChess } from "react-icons/fa"
import { FaTableTennis } from "react-icons/fa"
import { MdOutlineSportsSoccer } from "react-icons/md"

const userColumns: GridColDef[] = [
  { field: 'id', headerName: 'ID', width: 90 },
  {
    field: 'name',
    headerName: 'Name',
    editable: false,
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
        disabled
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
]

export const stringToIcon = (iconName: string) => {
  switch (iconName) {
    case 'chess':
      return <FaChess />
    case 'table-tennis':
      return <FaTableTennis />
    case 'fuseball':
      return <MdOutlineSportsSoccer />
    default:
      return null
  }
}

const sportColumns: GridColDef[] = [
  { field: 'id', headerName: 'ID', width: 90, sortable: false },
  { field: 'name', headerName: 'Name', width: 150, editable: false, sortable: false },
  {
    field: 'icon', headerName: 'Icon', width: 70, editable: false, sortable: false,
    renderCell(params) {
      return stringToIcon(params.row.icon)
    }
  },
]

const iconOptions = [
  { value: 'chess', icon: <FaChess /> },
  { value: 'table-tennis', icon: <FaTableTennis /> },
  { value: 'fuseball', icon: <MdOutlineSportsSoccer /> }
]

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
          width: 500,
          bgcolor: 'background.paper',
          border: '2px solid #000',
          boxShadow: 24,
          p: 4,
        }} >
          <Stack spacing={2}>
            <Typography id="modal-modal-title" variant="h4">New tournament</Typography>
            <AddTournament handleSubmit={handleAddClose} handleCancel={handleAddClose} />
          </Stack>
        </Box>
      </Modal>
      <GridToolbarContainer>
        <Button onClick={() => setAddModal(true)}>New Tournament</Button>
      </GridToolbarContainer>
    </>
  );
}

function CustomSportsToolbar() {
  const [addModal, setAddModal] = useState(false)
  const handleClose = () => { setAddModal(false) }
  const [sportName, setSportName] = useState('')
  const [selectedIcon, setSelectedIcon] = useState<string | null>(null)
  const { mutate: createSport } = api.sports.create.useMutation({
    onSuccess() {
      handleClose()
    }
  })

  return (
    <>
      <Dialog
        open={addModal}
        onClose={handleClose}
        maxWidth='xs'
        TransitionProps={{
          onEntering: () => {
            setSportName('')
            setSelectedIcon(null)
          }
        }}
      >
        <DialogTitle>New Sport</DialogTitle>

        <DialogContent dividers>
          <Stack spacing={2}>
            <TextField
              label='Sport name'
              value={sportName}
              onChange={e => setSportName(e.target.value)}
            />
            <FormControl>
              <InputLabel id="icon-select">Icon</InputLabel>
              <Select
                value={selectedIcon}
                onChange={e => setSelectedIcon(e.target.value as string)}
                label='Icon'
              >
                {iconOptions.map(iconOption => (
                  <MenuItem value={iconOption.value}>
                    <Stack direction='row' spacing={1} alignItems='center'>
                      <Box>
                        {iconOption.icon}
                      </Box>
                      <Box>
                        {iconOption.value}
                      </Box>
                    </Stack>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button variant="outlined" color='error' onClick={handleClose}>Close</Button>
          <Button variant='outlined' disabled={!sportName || !selectedIcon} onClick={() => createSport({ name: sportName, icon: selectedIcon! })}>Save</Button>
        </DialogActions>
      </Dialog>
      <GridToolbarContainer>
        <Button onClick={() => setAddModal(true)}>New sport</Button>
      </GridToolbarContainer>
    </>
  )
}

export default function Page() {
  const { data: users } = api.user.getAll.useQuery()
  const { data: tournaments } = api.tournament.getAll.useQuery()
  const { data: sports } = api.sports.all.useQuery()

  const tabs = [
    {
      title: 'Users',
      padding: 0,
      content: (
        <DataGrid
          rows={users ?? []}
          columns={userColumns}
          disableRowSelectionOnClick
          pageSizeOptions={[5]}
          sx={{ border: 0, minHeight: 500 }}
        />
      )
    },
    {
      title: 'Tournaments',
      padding: 0,
      content: (
        <Paper >
          <DataGrid
            rows={tournaments ?? []}
            columns={tournamentColumns}
            disableRowSelectionOnClick
            slots={{
              toolbar: CustomTournamentToolbar
            }}
            pageSizeOptions={[5]}
            sx={{ border: 0, minHeight: 500 }}
          />
        </Paper>
      )
    },
    {
      title: 'Sports',
      padding: 0,
      content: (
        <Paper>
          <DataGrid
            rows={sports ?? []}
            columns={sportColumns}
            disableRowSelectionOnClick
            slots={{
              toolbar: CustomSportsToolbar
            }}
            pageSizeOptions={[5]}
            sx={{ border: 0, minHeight: 500 }}
          />
        </Paper>
      )
    }
  ]

  return (
    <Box p={4}>
      <Paper>
        <TabPanel tabs={tabs} />
      </Paper>
    </Box>
  )
}

Page.getLayout = function getLayout(page: React.ReactElement) {
  return <Layout>
    {page}
  </Layout>
}

Page.auth = {
  role: 'admin'
}
