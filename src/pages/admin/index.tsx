import { Box, Button, Modal, Paper, Stack, Typography } from "@mui/material"

import { useState } from "react";
import { DataGrid, GridColDef, GridToolbarContainer } from '@mui/x-data-grid'
import { api } from "~/utils/api";
import AddTournament from "~/components/AddTournament";
import Layout from "~/components/Layout";
import TabPanel from "~/components/TabPanel";

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
            <Typography id="modal-modal-title" variant="h4">
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
