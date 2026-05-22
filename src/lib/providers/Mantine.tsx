'use client';

import { Box, MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { theme } from '../../../theme';

const Mantine = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      <MantineProvider forceColorScheme="light" theme={theme}>
        <Notifications />
        <Box>{children}</Box>
      </MantineProvider>
    </>
  );
};

export default Mantine;
