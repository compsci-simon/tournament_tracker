import { Box, Paper, Stack, Typography } from "@mui/material";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { useEffect } from "react";

export default function LogOutPage() {
  useEffect(() => {
    signOut({ redirect: false })
  }, [])
  return <Stack justifyContent='center' alignItems='center' sx={{ height: '100%' }}>
    <Paper>
      <Box padding={4} sx={{ textAlign: 'center' }}>
        <Typography variant='h4'>Logged out</Typography>
        <Link href='/auth/signin'>
          <Typography fontSize={12} sx={{ mt: '20px', textDecoration: 'underline' }}>Log in</Typography>
        </Link>
      </Box>
    </Paper>
  </Stack>
}

LogOutPage.auth = false