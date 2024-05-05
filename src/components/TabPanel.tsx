import * as React from 'react';
import { useEffect, useState } from 'react';

import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
  padding: number,
  scrollable?: boolean
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, padding, scrollable, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      style={{ flexGrow: 2, overflow: scrollable ? 'auto' : 'hidden' }}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: padding }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`,
  };
}

export type TabProps = {
  tabs: {
    title: string,
    content: React.ReactElement,
    padding?: number,
    scrollable?: boolean
  }[]
  tabIndex?: number
}

export default function BasicTabs({ tabs, tabIndex }: TabProps) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (tabIndex) {
      setValue(tabIndex)
    }
  }, [tabIndex])

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  return (
    <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={value} onChange={handleChange}>
          {tabs.map((tab, index) => {
            return <Tab key={`${index}`} label={tab.title} {...a11yProps(index)} />
          })}
        </Tabs>
      </Box>
      {tabs.map((tab, index) => {
        return (
          <TabPanel key={`${index}`} value={value} index={index} padding={tab.padding ?? 3} scrollable={tab.scrollable}>
            {tab.content}
          </TabPanel>
        )
      })}
    </Box>
  );
}