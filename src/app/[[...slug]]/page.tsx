import { redirect } from 'next/navigation';
import { IconLock } from '@tabler/icons-react';
import { Box, Stack, Text, Title } from '@mantine/core';

const CatchAllPage = () => {
  if (process.env.READ_ONLY !== 'true') {
    redirect('/transactions');
  }

  return (
    <Box
      style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f4f5f7',
      }}
    >
      <Stack align="center" gap="md">
        <IconLock size={40} stroke={1.5} color="var(--mantine-color-violet-6)" />
        <Title order={3}>Budgy</Title>
        <Text c="dimmed" ta="center" maw={360}>
          Dette er en delt læsevisning. Åbn et snapshot-link for at se data, eller brug
          Electron-appen for fuld adgang.
        </Text>
      </Stack>
    </Box>
  );
};

export default CatchAllPage;
