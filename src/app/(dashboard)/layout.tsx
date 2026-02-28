import { type ReactNode } from 'react';
import { Box } from '@mantine/core';
import State from '@/providers/State';
import { Navbar } from './_components/Navbar/Navbar';

type TProps = { children: ReactNode };

const Dashboard: React.FC<TProps> = async ({ children }) => {
  return (
    <State>
      <Box display="grid" style={{ gridTemplateColumns: 'max-content 1fr' }}>
        <Box h="100vh" bg="dark.8">
          <Navbar />
        </Box>
        <Box h="100vh" bg="dark.8" style={{ overflow: 'hidden' }}>
          <Box>{children}</Box>
        </Box>
      </Box>
    </State>
  );
};

export default Dashboard;
