import { Box, Button, FormControl, FormControlLabel, FormLabel, Grid, Paper, Radio, RadioGroup, Stack, TextField, Typography } from "@mui/material"
import Link from "next/link"
import { useRouter } from "next/router"
import { useState } from "react"
import { api } from "~/utils/api"
import { SHA256 } from 'crypto-js';
import { enqueueSnackbar } from 'notistack'

function SignUpPage() {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [nickname, setNickname] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [gender, setGender] = useState('female')
  const router = useRouter()
  const { mutate: createUserMutation } = api.user.createUser.useMutation({
    onSuccess() {
      setFirstName('')
      setLastName('')
      setNickname('')
      setEmail('')
      setPassword('')
      enqueueSnackbar('Successfully created user', { variant: 'success' })
      void router.push('/auth/signin')
    },
    onError(error, variables, context) {
      enqueueSnackbar('Failed to create user', { variant: 'error' })
    },
  })

  const handleSignUp = () => {
    createUserMutation({
      firstName,
      lastName,
      nickName: nickname,
      email,
      password: SHA256(password).toString(),
      gender
    })
  }

  return <Stack alignItems='center' justifyContent='center' sx={{ height: '100%' }}>
    <Box padding={2} maxWidth={600}>
      <Paper>
        <Box padding={5}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography fontSize={24}>Sign Up</Typography>
            </Grid>
            <Grid item xs={6}>
              <TextField
                label='First Name'
                type='text'
                fullWidth
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label='Last Name'
                type='text'
                fullWidth
                value={lastName}
                onChange={e => setLastName(e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label='Nickname (optional)'
                type='text'
                fullWidth
                value={nickname}
                onChange={e => setNickname(e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label='Email'
                type='text'
                fullWidth
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label='Password'
                type='password'
                fullWidth
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl>
                <FormLabel>Gender</FormLabel>
                <RadioGroup
                  aria-labelledby="demo-controlled-radio-buttons-group"
                  name="controlled-radio-buttons-group"
                  value={gender}
                  onChange={e => setGender(e.target.value)}
                >
                  <FormControlLabel value="female" control={<Radio />} label="Female" />
                  <FormControlLabel value="male" control={<Radio />} label="Male" />
                </RadioGroup>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <Button variant='outlined' onClick={handleSignUp}>
                Sign Up
              </Button>
            </Grid>
            <Grid item xs={12}>
              <Link href='/auth/signin'>
                <Typography variant='subtitle2' fontSize={11} sx={{ ml: '8px', textDecoration: 'underline' }}>
                  Already have an account? Sign In
                </Typography>
              </Link>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Box>
  </Stack>
}

export default SignUpPage
