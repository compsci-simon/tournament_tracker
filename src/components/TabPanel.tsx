import * as React from 'react';
import { useState } from 'react';

import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
  padding: number
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, padding, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
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

type TabProps = {
  tabs: {
    title: string,
    content: React.ReactElement,
    padding?: number
  }[]
}

export default function BasicTabs({ tabs }: TabProps) {
  const [value, setValue] = useState(0);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={value} onChange={handleChange}>
          {tabs.map((tab, index) => {
            return <Tab key={`${index}`} label={tab.title} {...a11yProps(index)} />
          })}
        </Tabs>
      </Box>
      {tabs.map((tab, index) => {
        return (
          <TabPanel key={`${index}`} value={value} index={index} padding={tab.padding ?? 3}>
            {tab.content}
          </TabPanel>
        )
      })}
    </Box>
  );
}