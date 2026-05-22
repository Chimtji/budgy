import { type ReactNode } from 'react';
import { Box } from '@mantine/core';
import State from '@/providers/State';
import { Navbar } from './_components/Navbar/Navbar';
import classes from './layout.module.css';

type TProps = { children: ReactNode };

const DashboardLayout: React.FC<TProps> = ({ children }) => {
  return (
    <State>
      <Box className={classes.root}>
        <Box className={classes.sidebar}>
          <Navbar />
        </Box>
        <Box className={classes.content}>{children}</Box>
      </Box>
    </State>
  );
};

export default DashboardLayout;
