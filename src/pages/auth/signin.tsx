import { Box, Button, Paper, Stack, TextField, Typography } from "@mui/material"
import { signIn } from "next-auth/react"
import Link from "next/link"
import { useState } from "react"
import { SHA256 } from 'crypto-js';
import { useRouter } from "next/router";
import { enqueueSnackbar } from "notistack";

function SignInPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const router = useRouter()
  const handleLogin = async () => {
    const res = await signIn('credentials', {
      email,
      password: SHA256(password).toString(),
      redirect: false
    })
    if (res?.status == 200) {
      enqueueSnackbar('Successfully signed in', { variant: 'success' })
      void router.push('/')
    } else {
      enqueueSnackbar('Failed to sign in', { variant: 'error' })
    }
  }

  return <Stack alignItems='center' justifyContent='center' sx={{ height: '100%' }}>
    <Box padding={2} maxWidth={600}>
      <Paper>
        <Box padding={5}>
          <Stack spacing={2}>
            <Typography fontSize={24}>Sign in</Typography>
            <TextField
              label='Email'
              type='text'
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
            <TextField
              label='Password'
              type='password'
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
            <Button variant='outlined' onClick={() => void handleLogin()}>
              Sign in
            </Button>
            <Link href='/auth/signup'>
              <Typography variant='subtitle2' fontSize={11} sx={{ ml: '8px', textDecoration: 'underline' }}>
                Don&lsquo;t have an account? Sign Up
              </Typography>
            </Link>
          </Stack>
        </Box>
      </Paper>
    </Box>
  </Stack>
}

export default SignInPage
