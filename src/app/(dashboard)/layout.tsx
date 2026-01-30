import { type ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { Box } from '@mantine/core';
import State from '@/providers/State';
import { getUserSession } from '@/service/server';
import { Navbar } from './_components/Navbar/Navbar';

type TProps = { children: ReactNode };

const Dashboard: React.FC<TProps> = async ({ children }) => {
  // // We check for user here serverside and not via userStore
  // // So the auth is calculated before client is rendered and thus before auth can be manipulated
  // const user = await getUserSession();
  // if (!user) {
  //   redirect('/login');
  // }

  return (
    <State>
      <Box display="grid" style={{ gridTemplateColumns: 'max-content 1fr' }}>
        <Box h="100vh" bg="dark.8">
          <Navbar />
        </Box>
        <Box h="100vh" bg="dark.8">
          <Box>{children}</Box>
        </Box>
      </Box>
    </State>
  );
};

export default Dashboard;
