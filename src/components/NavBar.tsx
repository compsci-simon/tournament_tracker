import * as React from 'react';
import { Dispatch, SetStateAction, useContext, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

import { Avatar, Button, Divider, ListItemText, Stack, Tooltip } from '@mui/material';
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
import { GameNotification } from '~/types';

const pages: { title: string, link: string }[] = [
  { title: 'Tournaments', link: 'tournaments' },
  { title: 'Players', link: 'players' },
  { title: 'Games', link: 'games' },
  { title: 'Quick-Game', link: 'quick-game' },
  { title: 'Info', link: 'info' },
];
const settings = ['Profile', 'Logout'];

const NotificationMenu = ({ anchorElState, notifications }: { anchorElState: [HTMLElement | null, Dispatch<SetStateAction<HTMLElement | null>>], notifications: GameNotification[] }) => {
  const { data: session } = useSession()
  const utils = api.useContext()
  if (!session?.user.email) return null
  const [anchorElNotifications, setAnchorElNotifications] = anchorElState
  const [onlyShowFive, setOnlyShowFive] = useState(true)
  const { mutate: setNotificationAsSeen } = api.notifications.playerSawNotification.useMutation({
    onSuccess(data) {
      utils.notifications.getPlayerNotifications.setData({
        playerEmail: session.user.email!
      }, oldData => {
        if (!oldData) return oldData
        return oldData.map(notification => {
          if (notification.id == data.id) {
            return {
              ...notification,
              seenByPlayer1: data.seenByPlayer1,
              seenByPlayer2: data.seenByPlayer2,
            }
          } else {
            return notification
          }
        })
      })
    },
  })
  const { mutate: setNotificationListAsSeen } = api.notifications.markSelectNotificationsAsRead.useMutation({
    onSuccess(data) {
      utils.notifications.getPlayerNotifications.setData({
        playerEmail: session.user.email!
      }, oldData => {
        if (!oldData) return oldData
        return oldData.map(notification => {
          if (notification.id in data) {
            return {
              ...notification,
              seenByPlayer1: data[notification.id].seenByPlayer1,
              seenByPlayer2: data[notification.id].seenByPlayer2,
            }
          }
          return notification
        })
      })
    },
  })
  notifications?.sort((a, b) => b.game.time.getTime() - a.game.time.getTime())
  if (onlyShowFive) {
    notifications = notifications?.slice(0, 5)
  }

  const handleCloseNotificationsMenu = () => {
    setOnlyShowFive(true)
    setAnchorElNotifications(null)
  }

  return (
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
        <Button size='small' onClick={() => setNotificationListAsSeen({ notificationIds: notifications.map(n => n.id) })}>Mark all as read</Button>
      </Stack>
      <hr />
      {(notifications ?? []).map(notification => {
        const seenByPlayer = session.user.email == notification.game.player1?.email ? notification.seenByPlayer1 : notification.seenByPlayer2
        const otherPlayerName = session.user.email == notification.game.player1?.email ? notification.game.player2?.name : notification.game.player1?.name
        return (
          <Link
            key={notification.id}
            onClick={() => setNotificationAsSeen({ notificationId: notification.id })}
            href={`/games/${notification.game.id}`}
          >
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
      {onlyShowFive && (
        <>
          <Divider sx={{ my: 1 }} />
          <MenuItem onClick={() => setOnlyShowFive(false)}>
            <ListItemText>Show all items</ListItemText>
          </MenuItem>
        </>
      )}
    </Menu>
  )
}

function ResponsiveAppBar() {
  const [isAdmin, setIsAdmin] = useState(false)
  const [anchorElNav, setAnchorElNav] = useState<null | HTMLElement>(null);
  const [anchorElUser, setAnchorElUser] = useState<null | HTMLElement>(null);
  const [anchorElNotifications, setAnchorElNotifications] = useState<null | HTMLElement>(null);
  const router = useRouter()
  const { dark, setDark } = useContext(ThemeContext)
  const { data: session } = useSession()
  useEffect(() => {
    if (session?.user.role == 'admin') {
      setIsAdmin(true)
    }
  }, [session])
  const { data: notifications } = api.notifications.getPlayerNotifications.useQuery({
    playerEmail: session?.user?.email ?? ''
  }, { enabled: Boolean(session?.user?.email) })

  const handleOpenNavMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElNav(event.currentTarget);
  }
  const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElUser(event.currentTarget);
  }
  const handleOpenNotificationsMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElNotifications(event.currentTarget)
  }

  const handleCloseNavMenu = () => {
    setAnchorElNav(null);
  }

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  }

  if (!session?.user.email) return null

  const unseenNotifications = notifications?.some(notification =>
    session.user.email == notification?.game?.player1?.email ?
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
                <Link key={page.link} href={`/${page.link}`}>
                  <MenuItem key={page.link} onClick={handleCloseNavMenu}>
                    <Typography textAlign="center">{page.title}</Typography>
                  </MenuItem>
                </Link>
              ))}
            </Menu>
          </Box>
          <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' } }}>
            {pages.map((page) => (
              <Button
                key={page.link}
                onClick={() => {
                  handleCloseNavMenu()
                  void router.push(`/${page.link}`)
                }}
                sx={{ my: 2, color: 'white', display: 'block' }}
              >
                {page.title}
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
              <NotificationMenu
                anchorElState={[anchorElNotifications, setAnchorElNotifications]}
                notifications={notifications}
              />
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