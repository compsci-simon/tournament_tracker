import { AppProps, type AppType } from "next/app";
import { api } from "~/utils/api";
import "~/styles/globals.css";
import { NextPage } from "next";
import { CssBaseline, ThemeProvider, createTheme } from "@mui/material";
import { Dispatch, SetStateAction, createContext, useState } from "react";
import { SessionProvider } from 'next-auth/react'

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
    <SessionProvider session={session}>
      {
        <ThemeProvider theme={dark ? theme : {}}>
          <CssBaseline />
          {getLayout(<Component {...pageProps} />)}
        </ThemeProvider>
      }
    </SessionProvider>
  </ThemeContext.Provider>
};

export default api.withTRPC(MyApp);
