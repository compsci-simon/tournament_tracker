import { AppProps, type AppType } from "next/app";
import { api } from "~/utils/api";
import "~/styles/globals.css";
import { NextPage } from "next";
import { CssBaseline, ThemeProvider, createTheme } from "@mui/material";
import { Dispatch, SetStateAction, createContext, useState } from "react";
import { SessionProvider, useSession } from 'next-auth/react'
import { useRouter } from "next/router";
import { SnackbarProvider } from 'notistack';
import { Session } from "next-auth";

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#90caf9', // Primary color
    },
    secondary: {
      main: '#f48fb1', // Secondary color
    },
    background: {
      default: '#404258', // Updated default background color
      paper: '#474E68',// Paper background color
    },
    text: {
      primary: '#EFEFEF', // Text color
      secondary: '#FFFFFF'
    },
    divider: 'rgba(255, 255, 255, 0.12)'
  },
  components: {
    MuiSelect: {
      styleOverrides: {
        select: {
          borderColor: '#EFEFEF'
        }
      }
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          borderColor: '#EFEFEF'
        }
      }
    }
  }
});

export type NextPageWithLayout<P = object, IP = P> = NextPage<P, IP> & {
  getLayout?: (page: React.ReactElement) => React.ReactNode
  auth?: { role: string } | boolean
}

type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout
}

export const ThemeContext = createContext<{ dark: boolean, setDark: Dispatch<SetStateAction<boolean>> | (() => void) }>({ dark: false, setDark() { return; } });

const MyApp: AppType = ({
  Component,
  pageProps: { session, ...pageProps }
}: AppPropsWithLayout) => {
  const getLayout = Component.getLayout ?? ((page) => page)
  const [dark, setDark] = useState(true)

  return <ThemeContext.Provider value={{ dark, setDark }}>
    <SessionProvider session={session as Session}>
      <SnackbarProvider>
        <ThemeProvider theme={dark ? theme : {}}>
          <CssBaseline />
          {Component.auth ?
            Component.auth !== true && Component.auth.role ?
              <AuthAdmin>
                {getLayout(<Component {...pageProps} />)}
              </AuthAdmin>
              :
              <Auth>
                {getLayout(<Component {...pageProps} />)}
              </Auth>
            : getLayout(<Component {...pageProps} />)}
        </ThemeProvider>
      </SnackbarProvider>
    </SessionProvider>
  </ThemeContext.Provider>
};

interface AuthProps {
  children: React.ReactNode;
}

function Auth({ children, ...rest }: AuthProps) {
  const { status } = useSession({ required: true })

  if (status === "loading") {
    return <div>Loading...</div>
  }

  return children
}

function AuthAdmin({ children, ...rest }: AuthProps) {
  const { data: session, status } = useSession({ required: true })
  const router = useRouter()

  if (status === "loading") {
    return <div>Loading...</div>
  }

  if (session.user.role != 'admin') {
    void router.push('/')
  }

  return children
}

export default api.withTRPC(MyApp);
