import * as React from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

import { Avatar, Button, Stack, Tooltip } from '@mui/material';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Menu from '@mui/material/Menu';
import Container from '@mui/material/Container';
import MenuItem from '@mui/material/MenuItem';
import MenuIcon from '@mui/icons-material/Menu';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import NotificationsIcon from '@mui/icons-material/Notifications';
import NotificationAddIcon from '@mui/icons-material/NotificationAdd';
import CircleNotificationsIcon from '@mui/icons-material/CircleNotifications';
import { useRouter } from 'next/router';

import ThemeSwitch from './ThemeSwitch';
import { ThemeContext } from '~/pages/_app';
import { api } from '~/utils/api';

const pages = ['Tournaments', 'Players', 'Games', 'Quick-Game'];
const settings = ['Profile', 'Logout'];

function ResponsiveAppBar() {
  const [isAdmin, setIsAdmin] = React.useState(false)
  const [anchorElNav, setAnchorElNav] = React.useState<null | HTMLElement>(null);
  const [anchorElUser, setAnchorElUser] = React.useState<null | HTMLElement>(null);
  const [anchorElNotifications, setAnchorElNotifications] = React.useState<null | HTMLElement>(null);
  const router = useRouter()
  const { dark, setDark } = React.useContext(ThemeContext)
  const { data: session } = useSession()
  React.useEffect(() => {
    if (session?.user.role == 'admin') {
      setIsAdmin(true)
    }
  }, [session])
  const { data: notifications } = api.notifications.getPlayerNotifications.useQuery({
    playerEmail: session?.user?.email
  })

  const handleOpenNavMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElNav(event.currentTarget);
  };
  const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElUser(event.currentTarget);
  };
  const handleOpenNotificationsMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElNotifications(event.currentTarget)
  }

  const handleCloseNavMenu = () => {
    setAnchorElNav(null);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  const handleCloseNotificationsMenu = () => {
    setAnchorElNotifications(null)
  }

  const unseenNotifications = notifications?.some(notification =>
    session.user.email == notification.game.player1.email ?
      !notification.seenByPlayer1 :
      !notification.seenByPlayer2
  )

  return (
    <AppBar position="static">
      <Container maxWidth="xl">
        <Toolbar disableGutters>
          <Link href='/'>
            <Stack spacing={1} direction='row' sx={{ marginRight: { md: '20px' } }}>
              <img src='/logo.svg' style={{ height: '30px', width: '30px' }} />
              <Typography
                variant="h6"
                noWrap
                sx={{
                  mr: 2,
                  display: { xs: 'none', md: 'flex' },
                  fontFamily: 'monospace',
                  fontWeight: 700,
                  letterSpacing: '.3rem',
                  color: 'inherit',
                  textDecoration: 'none',
                }}
              >
                League
              </Typography>
            </Stack>
          </Link>

          <Box sx={{ flexGrow: 1, display: { xs: 'flex', md: 'none' } }}>
            <IconButton
              size="large"
              aria-label="account of current user"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleOpenNavMenu}
              color="inherit"
            >
              <MenuIcon />
            </IconButton>
            <Menu
              id="menu-appbar"
              anchorEl={anchorElNav}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'left',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'left',
              }}
              open={Boolean(anchorElNav)}
              onClose={handleCloseNavMenu}
              sx={{
                display: { xs: 'block', md: 'none' },
              }}
            >
              {pages.map((page) => (
                <Link key={page} href={`/${page.toLowerCase()}`}>
                  <MenuItem key={page} onClick={handleCloseNavMenu}>
                    <Typography textAlign="center">{page}</Typography>
                  </MenuItem>
                </Link>
              ))}
            </Menu>
          </Box>
          <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' } }}>
            {pages.map((page) => (
              <Button
                key={page}
                onClick={() => {
                  handleCloseNavMenu()
                  void router.push(`/${page.toLowerCase()}`)
                }}
                sx={{ my: 2, color: 'white', display: 'block' }}
              >
                {page}
              </Button>
            ))}
          </Box>

          <Stack direction='row' alignItems='center' spacing={2}>
            {/* Theme switch */}
            <ThemeSwitch defaultChecked value={dark} onChange={() => setDark(!dark)} />

            {/* Admin button */}
            {isAdmin ?
              <Link href='/admin' style={{ lineHeight: 0 }}>
                <AdminPanelSettingsIcon fontSize='large' />
              </Link>
              : null
            }

            {/* Notifications */}
            <Box sx={{ flexGrow: 0 }}>
              <Tooltip title="Open settings">
                <IconButton onClick={handleOpenNotificationsMenu} sx={{ p: 1 }}>
                  {unseenNotifications ?
                    <NotificationAddIcon fontSize='medium' /> :
                    <NotificationsIcon fontSize='medium' />
                  }
                </IconButton>
              </Tooltip>
              <Menu
                sx={{ mt: '45px' }}
                id="menu-appbar"
                anchorEl={anchorElNotifications}
                anchorOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                keepMounted
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                open={Boolean(anchorElNotifications)}
                onClose={handleCloseNotificationsMenu}
              >
                <Stack direction='row' justifyContent='space-between' paddingX={1} alignContent='center'>
                  <Typography variant='h6'>Notifications</Typography>
                  <Button size='small'>
                    Mark all as read
                  </Button>
                </Stack>
                <hr />
                {(notifications ?? [])
                  .map(notification => {
                    const seenByPlayer = session.user.email == notification.game.player1.email ? notification.seenByPlayer1
                      : notification.seenByPlayer2
                    const otherPlayerName = session.user.email == notification.game.player1.email ? notification.game.player2.name
                      : notification.game.player1.name
                    return (
                      <Link key={notification.id} href={`/games/${notification.game.id}`}>
                        <MenuItem sx={{ paddingY: 0.5 }} onClick={handleCloseNotificationsMenu}>
                          <Stack direction='row' spacing={1}>
                            {!seenByPlayer && <CircleNotificationsIcon color='error' />}
                            <Typography color={seenByPlayer ? '#B2BABB' : 'white'} variant='subtitle2' textAlign="center">
                              New quick game vs {otherPlayerName} - <Typography variant='caption'>{notification.game.time.toLocaleString()}</Typography>
                            </Typography>
                          </Stack>
                        </MenuItem>
                      </Link>
                    )
                  })}
              </Menu>
            </Box>

            {/* User profile */}
            <Box sx={{ flexGrow: 0 }}>
              <Tooltip title="Open settings">
                <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                  <Avatar alt="Remy Sharp" src={session?.user?.image ?? ''} />
                </IconButton>
              </Tooltip>
              <Menu
                sx={{ mt: '45px' }}
                id="menu-appbar"
                anchorEl={anchorElUser}
                anchorOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                keepMounted
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                open={Boolean(anchorElUser)}
                onClose={handleCloseUserMenu}
              >
                {settings.map((setting) => (
                  <Link key={setting} href={`/${setting.toLowerCase()}`}>
                    <MenuItem onClick={handleCloseUserMenu}>
                      <Typography textAlign="center">{setting}</Typography>
                    </MenuItem>
                  </Link>
                ))}
              </Menu>
            </Box>
          </Stack>

        </Toolbar>
      </Container>
    </AppBar >
  );
}
export default ResponsiveAppBar;