import { Box, Group, Title } from '@mantine/core';
import { ShareHistory } from './_components/ShareHistory';

const ShareHistoryPage = () => {
  return (
    <Box p="xl" maw={1100} mx="auto">
      <Group mb="xl" justify="space-between" align="center">
        <Title order={2}>Mine delinger</Title>
      </Group>

      <ShareHistory />
    </Box>
  );
};

export default ShareHistoryPage;
