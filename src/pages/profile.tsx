import { Box, Button, Grid, Modal, Paper, Stack, TextField, Typography } from "@mui/material"
import { useSession } from "next-auth/react"
import { Dispatch, SetStateAction, useState } from "react";
import Layout from "~/components/Layout"
import { api } from "~/utils/api"
import { SHA256 } from 'crypto-js';
import { generateAvatar } from "~/utils/users";

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

type EditUserModalProps = {
  open: boolean
  setOpen: Dispatch<SetStateAction<boolean>>
  user: {
    id: string;
    email: string;
    createdAt: Date;
    firstName: string;
    lastName: string;
    password: string;
    nickName: string | null;
    avatar: string;
  }
}

function EditUserModal(props: EditUserModalProps) {
  const { open, setOpen, user } = props
  const [firstName, setFirstName] = useState(user.firstName)
  const [lastName, setLastName] = useState(user.lastName)
  const [email, setEmail] = useState(user.email)
  const [nickName, setNickName] = useState(user.nickName ?? '')
  const [password, setPassword] = useState('')
  const [avatar, setAvatar] = useState(user.avatar)
  const { update: updateSession } = useSession()
  const { mutate: updateUserMutation } = api.user.updateUserProfile.useMutation({
    onSuccess() {
      setOpen(false)
      updateSession({
        image: avatar,
      })
    }
  })
  const { mutate: changePasswordMutation } = api.user.changePassword.useMutation()
  const handleClose = () => setOpen(false);
  const changeAvatar = async () => {
    const newAvatar = await generateAvatar('', '')
    setAvatar(newAvatar)
  }

  return <div>
    <Modal
      open={open}
      onClose={handleClose}
    >
      <Box sx={style}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Stack justifyContent='center' alignItems='center'>
              <img style={{ height: '140px' }} src={avatar} />
            </Stack>
          </Grid>
          <Grid item xs={6}>
            <Button
              variant='outlined'
              onClick={changeAvatar}
            >
              Change avatar
            </Button>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="h6" component="h2">
              Update user profile
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <TextField
              label='First Name'
              value={firstName}
              onChange={e => setFirstName(e.target.value)}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              label='Last Name'
              value={lastName}
              onChange={e => setLastName(e.target.value)}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              label='Email'
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              label='Nick Name (optional)'
              value={nickName}
              onChange={e => setNickName(e.target.value)}
            />
          </Grid>
          <Grid item xs={6} >
            <TextField
              label='Password'
              type='password'
              value={password}
              onChange={e => setPassword(e.target.value)}
              sx={{ height: '40px' }}
            />
          </Grid>
          <Grid item xs={6}>
            <Button
              onClick={() => {
                changePasswordMutation({ id: user.id, newPassword: SHA256(password).toString() })
              }}
              variant='outlined'
            >
              Change password
            </Button>
          </Grid>
          <Grid item xs={12}>
            <Button variant='outlined' onClick={() => {
              updateUserMutation({
                id: user.id,
                email,
                firstName,
                lastName,
                nickName: nickName ?? null,
                avatar
              })
            }}>
              Update profile
            </Button>
          </Grid>
        </Grid>
      </Box>
    </Modal>
  </div>
}

export default function ProfilePage() {
  const [open, setOpen] = useState(false);
  const { data: session } = useSession()
  const { data: user } = api.user.userProfile.useQuery({
    email: session?.user?.email
  })
  return <Box padding={4}>
    {user ?
      <EditUserModal open={open} setOpen={setOpen} user={user} />
      : null
    }
    <Paper>
      <Box padding={4}>
        <Stack spacing={2}>
          <Stack direction='row' justifyContent='space-between'>
            <Typography variant='h4' >{user?.firstName} {user?.lastName} {user?.nickName ? <span>({user?.nickName})</span> : null}</Typography>
            <Button variant="outlined" onClick={() => setOpen(true)}>
              Edit
            </Button>
          </Stack>
          <Stack spacing={4} direction='row'>
            <Box padding={2}>
              <img src={user?.avatar} />
            </Box>
            <Grid container>
              <Grid item xs={12}>
                <Typography fontSize={24}>Trophies</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography fontSize={12}>No trophies yet...</Typography>
              </Grid>
            </Grid>
          </Stack>
        </Stack>
      </Box>
    </Paper>
  </Box>
}

ProfilePage.getLayout = function getLayout(page: React.ReactElement) {
  return <Layout>
    {page}
  </Layout>
}

ProfilePage.auth = true