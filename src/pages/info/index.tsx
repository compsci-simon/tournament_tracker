import { Box, Collapse, Divider, List, ListItem, ListItemButton, ListItemText, Paper, Typography } from "@mui/material"
import { Stack } from "@mui/system"
import Layout from "~/components/Layout"
import { api } from "~/utils/api"
import TabPanel, { TabProps } from '../../components/TabPanel'
import { useState } from "react"
import { ExpandLess, ExpandMore } from "@mui/icons-material"

type tabItems = 'decay' | 'tournament_bonus'
function InfoPage() {
  const { data, isLoading } = api.admin.getServerSettings.useQuery()
  const [openTabs, setOpenTabs] = useState<(tabItems)[]>([])
  const handleClick = (item: tabItems) => {
    if (openTabs.includes(item)) {
      setOpenTabs(openTabs.filter(tab => tab != item))
    } else {
      setOpenTabs([...openTabs, item])
    }
  }

  if (isLoading) return null

  const items: {
    title: string,
    type: tabItems,
    text: string
  }[] = [
      { title: 'Decay', type: 'decay', text: 'If a player has not played any games for a given period, the player will have their elo decreased due to lack of activity. The decay interval specifies how regularly a player will have their score decayed. The decay amount is by how much the rating is decreased, and the threshold exempts ratings below the threshold from decay.' },
      { title: 'Tournament Bonus', type: 'tournament_bonus', text: 'A tournament bonus is the additional value added to a player\'s rating if they win a tournament. This helps introduce rating points into the system to offset the decay.' }
    ]

  const tabs: TabProps['tabs'] = [
    {
      title: 'What is this',
      scrollable: true,
      content: (
        <>
          <List disablePadding>
            {items.map(item => (
              <>
                <ListItemButton onClick={() => handleClick(item.type)} sx={{ width: '100%' }}>
                  <ListItemText primary={item.title} />
                  {openTabs.includes(item.type) ? <ExpandLess /> : <ExpandMore />}
                </ListItemButton>
                <Divider />
                <Collapse in={openTabs.includes(item.type)} timeout="auto" unmountOnExit>
                  <Box sx={{ paddingLeft: 2, py: 2 }}>
                    <Paper elevation={0}>
                      <Box p={4}>
                        <Typography>
                          {item.text}
                        </Typography>
                      </Box>
                    </Paper>
                  </Box>
                </Collapse>
              </>
            ))}
          </List>
        </>
      )
    },
    {
      title: 'Values',
      content: (
        <pre>
          {JSON.stringify(data, undefined, 2)}
        </pre>
      )
    }
  ]

  return (
    <Stack justifyContent='center' alignItems='center' height='100%'>
      <Paper sx={{ p: 4, height: '500px', width: '500px' }}>
        <TabPanel tabs={tabs} />
      </Paper>
    </Stack>
  )
}

InfoPage.getLayout = function getLayout(page: React.ReactElement) {
  return (
    <Layout>
      {page}
    </Layout>
  )
}
InfoPage.auth = true

export default InfoPage
