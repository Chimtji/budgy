'use client';

import { type ReactNode } from 'react';
import { Box } from '@mantine/core';
import State from '@/providers/State';
import Navbar from './_components/Navbar/Navbar';
import NavHeader from './_components/NavHeader/NavHeader';
import classes from './layout.module.css';

type TProps = { children: ReactNode };

const Dashboard: React.FC<TProps> = ({ children }) => {
  return (
    <State>
      <Box display="grid" style={{ gridTemplateColumns: '90px 1fr', height: '100vh' }}>
        <Box h="100vh" bg="dark.8" p="md">
          <Navbar />
        </Box>
        <Box bg="dark.8" className={classes.page}>
          <Box h="100vh">{children}</Box>
        </Box>
      </Box>
    </State>
  );
};

export default Dashboard;
